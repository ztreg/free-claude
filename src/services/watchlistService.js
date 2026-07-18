import { supabase } from '../lib/supabaseClient';

// Get user's profile ID
async function getUserProfileId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();
  
  if (error) throw error;
  return profile.id;
}

// Get all stocks in user's watchlist
export async function getWatchlist() {
  try {
    const profileId = await getUserProfileId();
    
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', profileId)
      .order('added_at', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting watchlist:', error);
    return [];
  }
}

// Add stock to watchlist
export async function addToWatchlist(stock) {
  try {
    const profileId = await getUserProfileId();
    
    const { data, error } = await supabase
      .from('watchlist')
      .insert({
        user_id: profileId,
        ticker: stock.symbol,
        company_name: stock.name
      })
      .select()
      .single();
    
    if (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Stock already in watchlist');
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    throw error;
  }
}

// Remove stock from watchlist
export async function removeFromWatchlist(ticker) {
  try {
    const profileId = await getUserProfileId();
    
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', profileId)
      .eq('ticker', ticker);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    throw error;
  }
}

// Cache stock price data
export async function cacheStockPrice(ticker, priceData) {
  try {
    const { error } = await supabase
      .from('stock_prices')
      .upsert({
        ticker,
        date: new Date().toISOString().split('T')[0],
        open_price: priceData.open,
        high_price: priceData.high,
        low_price: priceData.low,
        close_price: priceData.price,
        volume: priceData.volume
      }, {
        onConflict: 'ticker,date'
      });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error caching stock price:', error);
    return false;
  }
}

// Get cached stock price
export async function getCachedStockPrice(ticker) {
  try {
    const { data, error } = await supabase
      .from('stock_prices')
      .select('*')
      .eq('ticker', ticker)
      .order('date', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error getting cached stock price:', error);
    return null;
  }
}
