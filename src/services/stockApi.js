import axios from 'axios';

// Finnhub API - Free tier: 60 calls/minute (86,400/day)
const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY || 'YOUR_FINNHUB_API_KEY';

// Search for stocks using Finnhub
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
    return getMockStockResults(query);
  }
}

// Get stock price data using Finnhub
export async function getStockPrice(symbol) {
  try {
    const response = await axios.get(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );
    
    const quote = response.data;
    if (quote && quote.c) {
      const currentPrice = quote.c;
      const previousClose = quote.pc;
      const change = currentPrice - previousClose;
      const changePercent = (change / previousClose) * 100;
      
      return {
        symbol: symbol.toUpperCase(),
        price: currentPrice,
        change: change,
        changePercent: changePercent,
        open: quote.o,
        high: quote.h,
        low: quote.l,
        volume: 0, // Finnhub quote doesn't include volume
        previousClose: previousClose,
        lastUpdated: new Date().toISOString().split('T')[0]
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting stock price:', error);
    return getMockStockPrice(symbol);
  }
}

// Get historical data for charts using Finnhub
export async function getHistoricalData(symbol, timeframe = 'daily') {
  try {
    // Calculate date range (last 30 days for daily, etc.)
    const endDate = Math.floor(Date.now() / 1000);
    const startDate = endDate - (30 * 24 * 60 * 60); // 30 days ago
    
    const response = await axios.get(
      `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${startDate}&to=${endDate}&token=${FINNHUB_API_KEY}`
    );
    
    if (response.data && response.data.s === 'ok' && response.data.t) {
      return response.data.t.map((timestamp, index) => ({
        date: new Date(timestamp * 1000).toISOString().split('T')[0],
        open: response.data.o[index],
        high: response.data.h[index],
        low: response.data.l[index],
        close: response.data.c[index],
        volume: response.data.v[index]
      }));
    }
    return [];
  } catch (error) {
    console.error('Error getting historical data:', error);
    return getMockHistoricalData(symbol);
  }
}

// Mock data for demo purposes when API fails
function getMockStockResults(query) {
  const mockStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', type: 'Common Stock' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'Common Stock' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Common Stock' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'Common Stock' },
    { symbol: 'TSLA', name: 'Tesla Inc.', type: 'Common Stock' },
    { symbol: 'META', name: 'Meta Platforms Inc.', type: 'Common Stock' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'Common Stock' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', type: 'Common Stock' },
  ];
  
  return mockStocks.filter(stock => 
    stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
    stock.name.toLowerCase().includes(query.toLowerCase())
  );
}

function getMockStockPrice(symbol) {
  const basePrice = Math.random() * 200 + 50;
  const change = (Math.random() - 0.5) * 10;
  
  return {
    symbol: symbol.toUpperCase(),
    price: basePrice,
    change: change,
    changePercent: (change / basePrice) * 100,
    open: basePrice - change / 2,
    high: basePrice + Math.random() * 5,
    low: basePrice - Math.random() * 5,
    volume: Math.floor(Math.random() * 10000000),
    previousClose: basePrice - change,
    lastUpdated: new Date().toISOString().split('T')[0]
  };
}

function getMockHistoricalData(symbol) {
  const data = [];
  const basePrice = Math.random() * 200 + 50;
  let currentPrice = basePrice;
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const open = currentPrice;
    const change = (Math.random() - 0.5) * 5;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;
    
    data.push({
      date: date.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 10000000)
    });
    
    currentPrice = close;
  }
  
  return data;
}
