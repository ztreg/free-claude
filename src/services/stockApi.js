import axios from 'axios';

// Finnhub API - Free tier: 60 calls/minute (86,400/day)
const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY || 'YOUR_FINNHUB_API_KEY';

// Oanor API - Free Swedish stock API (100 calls/month free tier)
const OANOR_API_KEY = import.meta.env.VITE_OANOR_API_KEY || '';
const OANOR_API_BASE = 'https://api.oanor.com/v1';

// Exchange rates (base: USD) - Fetched from currency API
let EXCHANGE_RATES = {
  USD: 1.0,
  SEK: 10.5,  // Fallback rate - will be updated dynamically
  EUR: 0.92,  // Fallback rate - will be updated dynamically
  GBP: 0.79   // Fallback rate - will be updated dynamically
};

// Fetch live exchange rates from exchangerate-api.com
async function fetchExchangeRates() {
  try {
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
    if (response.data && response.data.rates) {
      EXCHANGE_RATES = {
        USD: 1.0,
        SEK: response.data.rates.SEK || 10.5,
        EUR: response.data.rates.EUR || 0.92,
        GBP: response.data.rates.GBP || 0.79
      };
      console.log('Exchange rates updated:', EXCHANGE_RATES);
    }
  } catch (error) {
    console.error('Failed to fetch exchange rates, using fallback:', error);
  }
}

// Initialize exchange rates on module load
fetchExchangeRates();

// Convert price from USD to target currency
function convertPrice(price, fromCurrency = 'USD', toCurrency = 'USD') {
  if (fromCurrency === toCurrency) return price;
  
  const fromRate = EXCHANGE_RATES[fromCurrency] || 1.0;
  const toRate = EXCHANGE_RATES[toCurrency] || 1.0;
  
  // Convert to USD first, then to target currency
  const priceInUSD = price / fromRate;
  return priceInUSD * toRate;
}

// Normalize Swedish stock symbols (convert spaces to hyphens)
function normalizeSymbol(symbol) {
  // Swedish stocks often use format like "VOLV B.ST" but Finnhub expects "VOLV-B.ST"
  return symbol.replace(/\s+/g, '-');
}

// Detect if a symbol is likely a Swedish/Nordic stock
function isNordicStock(symbol) {
  // Check for common Nordic exchange suffixes
  const nordicExchanges = ['.ST', '.HE', '.CO', '.OL'];
  return nordicExchanges.some(ext => symbol.toUpperCase().endsWith(ext));
}

// Get data from Oanor API for Swedish stocks
async function getOanorStockData(symbol) {
  if (!OANOR_API_KEY) {
    console.warn('Oanor API key not configured');
    return null;
  }
  
  try {
    const response = await axios.get(
      `${OANOR_API_BASE}/stock/${symbol}`,
      {
        headers: {
          'x-oanor-key': OANOR_API_KEY
        }
      }
    );
    
    if (response.data) {
      const data = response.data;
      return {
        symbol: data.symbol || symbol,
        name: data.name || symbol,
        price: data.price || 0,
        change: data.change || 0,
        changePercent: data.changePercent || 0,
        currency: data.currency || 'SEK',
        market: 'OMX Stockholm',
        lastUpdated: data.timestamp || new Date().toISOString()
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching Oanor stock data:', error);
    return null;
  }
}

// Search for stocks - tries Finnhub (works for most markets)
export async function searchStocks(query) {
  try {
    const response = await axios.get(
      `https://finnhub.io/api/v1/search?q=${query}&token=${FINNHUB_API_KEY}`
    );
    
    if (response.data && response.data.result) {
      return response.data.result.map(stock => ({
        symbol: stock.symbol,
        name: stock.description,
        type: stock.type,
        primary: stock.primary
      }));
    }
    return [];
  } catch (error) {
    console.error('Error searching stocks:', error);
    
    // Check for 403 error - could be symbol format issue or access issue
    if (error.response?.status === 403) {
      throw new Error(
        `Search failed. This might be due to: ` +
        `1) Incorrect symbol format (use hyphens: VOLV-B.ST not VOLV B.ST) ` +
        `2) The stock might not be available on Finnhub. ` +
        `Try the correct symbol format or try US stocks like AAPL, GOOGL, MSFT.`
      );
    }
    
    throw new Error('Failed to search stocks. Please try again later.');
  }
}

// Get stock price data - tries Oanor for Swedish stocks, Finnhub for others
export async function getStockPrice(symbol, targetCurrency = 'SEK') {
  // Normalize symbol first (convert spaces to hyphens)
  const normalizedSymbol = normalizeSymbol(symbol);
  
  // Try Oanor API first for Swedish stocks
  if (isNordicStock(normalizedSymbol) && OANOR_API_KEY) {
    const oanorData = await getOanorStockData(normalizedSymbol);
    if (oanorData) {
      // Swedish stocks are in SEK natively, so we only convert if target is not SEK
      const price = oanorData.currency !== targetCurrency
        ? convertPrice(oanorData.price, oanorData.currency, targetCurrency)
        : oanorData.price;

      const change = oanorData.currency !== targetCurrency
        ? convertPrice(oanorData.change || 0, oanorData.currency, targetCurrency)
        : (oanorData.change || 0);

      return {
        symbol: oanorData.symbol,
        price: price,
        change: change,
        changePercent: oanorData.changePercent || 0,
        open: price - change, // Estimate open price
        high: price + Math.abs(change) * 0.5, // Estimate high
        low: price - Math.abs(change) * 0.5, // Estimate low
        volume: 0, // Oanor API might not provide volume
        previousClose: price - change,
        lastUpdated: oanorData.lastUpdated,
        currency: targetCurrency,
        market: oanorData.market
      };
    }
  }

  // Fall back to Finnhub for US stocks or if Oanor fails
  try {
    const response = await axios.get(
      `https://finnhub.io/api/v1/quote?symbol=${normalizedSymbol}&token=${FINNHUB_API_KEY}`
    );
    
    const quote = response.data;
    if (quote && quote.c) {
      const currentPrice = quote.c;
      const previousClose = quote.pc;
      const change = currentPrice - previousClose;
      const changePercent = (change / previousClose) * 100;
      
      // Convert prices to target currency
      const convertedPrice = convertPrice(currentPrice, 'USD', targetCurrency);
      const convertedPreviousClose = convertPrice(previousClose, 'USD', targetCurrency);
      const convertedChange = convertedPrice - convertedPreviousClose;
      const convertedOpen = convertPrice(quote.o, 'USD', targetCurrency);
      const convertedHigh = convertPrice(quote.h, 'USD', targetCurrency);
      const convertedLow = convertPrice(quote.l, 'USD', targetCurrency);
      
      return {
        symbol: symbol.toUpperCase(), // Keep original symbol format
        price: convertedPrice,
        change: convertedChange,
        changePercent: changePercent, // Percentage doesn't change with currency conversion
        open: convertedOpen,
        high: convertedHigh,
        low: convertedLow,
        volume: 0, // Finnhub quote doesn't include volume
        previousClose: convertedPreviousClose,
        lastUpdated: new Date().toISOString().split('T')[0],
        currency: targetCurrency
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting stock price from Finnhub:', error);
    
    // Check for 403 error - could be symbol format issue or the stock not being available
    if (error.response?.status === 403) {
      throw new Error(
        `${symbol} - This might be due to: ` +
        `1) Incorrect symbol format (Swedish stocks use hyphens: VOLV-B.ST not VOLV B.ST) ` +
        `2) The stock might not be available on Finnhub. ` +
        `Try the correct symbol format or search for it first.`
      );
    }
    
    throw new Error(`Failed to get price for ${symbol}. Please try again later.`);
  }
}

// Get historical data for charts - uses Finnhub
export async function getHistoricalData(symbol, timeframe = 'daily', targetCurrency = 'SEK') {
  try {
    // Normalize symbol first (convert spaces to hyphens)
    const normalizedSymbol = normalizeSymbol(symbol);
    
    // Calculate date range (last 30 days for daily, etc.)
    const endDate = Math.floor(Date.now() / 1000);
    const startDate = endDate - (30 * 24 * 60 * 60); // 30 days ago
    
    const response = await axios.get(
      `https://finnhub.io/api/v1/stock/candle?symbol=${normalizedSymbol}&resolution=D&from=${startDate}&to=${endDate}&token=${FINNHUB_API_KEY}`
    );
    
    if (response.data && response.data.s === 'ok' && response.data.t) {
      return response.data.t.map((timestamp, index) => ({
        date: new Date(timestamp * 1000).toISOString().split('T')[0],
        open: convertPrice(response.data.o[index], 'USD', targetCurrency),
        high: convertPrice(response.data.h[index], 'USD', targetCurrency),
        low: convertPrice(response.data.l[index], 'USD', targetCurrency),
        close: convertPrice(response.data.c[index], 'USD', targetCurrency),
        volume: response.data.v[index],
        currency: targetCurrency
      }));
    }
    return [];
  } catch (error) {
    console.error('Error getting historical data from Finnhub:', error);
    
    // Check for 403 error - could be symbol format issue or the stock not being available
    if (error.response?.status === 403) {
      throw new Error(
        `${symbol} - Historical data not available. ` +
        `This might be due to incorrect symbol format or the stock not being available on Finnhub.`
      );
    }
    
    throw new Error(`Failed to get historical data for ${symbol}. Please try again later.`);
  }
}
