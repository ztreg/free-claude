import axios from 'axios';

// Finnhub API - Free tier: 60 calls/minute (86,400/day)
const rawFinnhubKey = import.meta.env.VITE_FINNHUB_API_KEY ?? '';
const FINNHUB_API_KEY = rawFinnhubKey.trim();

// Oanor API - Free Swedish stock API (100 calls/month free tier)
const OANOR_API_KEY = (import.meta.env.VITE_OANOR_API_KEY || '').trim();

function isPlaceholderFinnhubKey(key) {
  return !key || /your[_-]?finnhub[_-]?api[_-]?key/i.test(key);
}

function ensureFinnhubKey() {
  if (isPlaceholderFinnhubKey(FINNHUB_API_KEY)) {
    throw new Error('Finnhub API key is missing or invalid. Please set VITE_FINNHUB_API_KEY in your .env file.');
  }
}
const OANOR_API_BASE = 'https://api.oanor.com/v1';

const YAHOO_SYMBOL_OVERRIDES = {
  'BODY.SL': 'STHLM.ST',
  'STHLM.SL': 'STHLM.ST'
};

const YAHOO_SYMBOL_FALLBACKS = {
  'BODY.SL': ['STHLM.ST', 'STHLM.XSAT', 'BODY.ST'],
  'STHLM.SL': ['STHLM.ST', 'STHLM.XSAT', 'BODY.ST']
};

// Exchange rates (base: USD) - Fetched from currency API
let EXCHANGE_RATES = {
  USD: 1.0,
  SEK: 10.5,  // Fallback rate - will be updated dynamically
  EUR: 0.92,  // Fallback rate - will be updated dynamically
  GBP: 0.79   // Fallback rate - will be updated dynamically
};

const pendingPriceRequests = new Map();

// Fetch live exchange rates from exchangerate-api.com
async function fetchExchangeRates() {
  try {
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
    if (response?.data?.rates) {
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
  const nordicExchanges = ['.ST', '.HE', '.CO', '.OL', '.SL'];
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

async function searchFinnhubSymbol(query) {
  try {
    ensureFinnhubKey();
    const response = await axios.get(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`
    );

    const results = response?.data?.result || [];
    if (results.length === 0) {
      return null;
    }

    const upperQuery = query.toUpperCase();
    const exactMatch = results.find((item) => item.symbol?.toUpperCase() === upperQuery);
    if (exactMatch) {
      return exactMatch.symbol;
    }

    const fuzzyMatch = results.find((item) =>
      item.symbol?.toUpperCase().startsWith(upperQuery) ||
      item.description?.toUpperCase().includes(upperQuery)
    );

    return fuzzyMatch?.symbol || results[0].symbol;
  } catch (error) {
    console.error('Error searching Finnhub symbol:', error);
    return null;
  }
}

function getYahooSymbol(symbol) {
  const normalized = symbol
    .trim()
    .replace(/\s+/g, '-')
    .replaceAll('_', '-')
    .replace(/\.STO$/i, '.ST')
    .toUpperCase();

  return YAHOO_SYMBOL_OVERRIDES[normalized] || normalized;
}

function getYahooFallbackSymbols(symbol) {
  const normalized = symbol
    .trim()
    .replace(/\s+/g, '-')
    .replaceAll('_', '-')
    .replace(/\.STO$/i, '.ST')
    .toUpperCase();

  return YAHOO_SYMBOL_FALLBACKS[normalized] || [getYahooSymbol(symbol)];
}

async function tryYahooRequest(symbol, range, interval) {
  const response = await axios.get(
    `/api/stock/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`
  );
  return response?.data;
}

async function getYahooQuote(symbol, targetCurrency = 'SEK') {
  const fallbackSymbols = getYahooFallbackSymbols(symbol);
  let lastError = null;

  for (const candidate of fallbackSymbols) {
    try {
      const responseData = await tryYahooRequest(candidate, '1d', '5m');
      const result = responseData?.chart?.result?.[0];
      const meta = result?.meta;
      const quote = result?.indicators?.quote?.[0];
      const latestIndex = Math.max(0, (quote?.close?.length ?? 1) - 1);
      const currentPrice = meta?.regularMarketPrice ?? quote?.close?.[latestIndex];

      if (currentPrice == null) {
        if (responseData?.chart?.error || responseData?.chart?.result == null) {
          lastError = new Error(`Yahoo no data for ${candidate}`);
          continue;
        }
      }

      const previousClose = meta?.chartPreviousClose ?? meta?.previousClose ?? quote?.close?.[Math.max(0, latestIndex - 1)] ?? 0;
      const currency = meta?.currency || 'USD';
      const convertedPrice = convertPrice(currentPrice, currency, targetCurrency);
      const convertedPreviousClose = convertPrice(previousClose, currency, targetCurrency);
      const openPrice = quote?.open?.[latestIndex] ?? currentPrice;
      const highPrice = quote?.high?.[latestIndex] ?? currentPrice;
      const lowPrice = quote?.low?.[latestIndex] ?? currentPrice;

      return {
        symbol: candidate,
        price: convertedPrice,
        change: convertedPrice - convertedPreviousClose,
        changePercent: convertedPreviousClose ? ((convertedPrice - convertedPreviousClose) / convertedPreviousClose) * 100 : 0,
        open: convertPrice(openPrice, currency, targetCurrency),
        high: convertPrice(highPrice, currency, targetCurrency),
        low: convertPrice(lowPrice, currency, targetCurrency),
        volume: quote?.volume?.[latestIndex] || 0,
        previousClose: convertedPreviousClose,
        lastUpdated: meta?.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        currency: targetCurrency,
        market: 'Yahoo Finance'
      };
    } catch (error) {
      lastError = error;
      console.warn(`Yahoo fallback ${candidate} failed:`, error?.message || error);
      continue;
    }
  }

  if (lastError) {
    console.error(`Yahoo quote lookup failed for ${symbol}:`, lastError);
  }
  return null;
}

async function getYahooHistorical(symbol, timeframe = 'daily', targetCurrency = 'SEK') {
  const fallbackSymbols = getYahooFallbackSymbols(symbol);
  let lastError = null;

  for (const candidate of fallbackSymbols) {
    const yahooSymbol = candidate;
    let range = '1mo';
    let interval = '1d';

    if (timeframe === 'weekly') {
      range = '3mo';
      interval = '1wk';
    } else if (timeframe === 'monthly') {
      range = '1y';
      interval = '1mo';
    }

    try {
      const response = await axios.get(
        `/api/stock/${encodeURIComponent(yahooSymbol)}?range=${range}&interval=${interval}`
      );

      const result = response?.data?.chart?.result?.[0];
      const quote = result?.indicators?.quote?.[0];
      const timestamps = result?.timestamp;
      const currency = result?.meta?.currency || 'SEK';

      if (!timestamps || !quote) {
        lastError = new Error(`Yahoo no data for ${yahooSymbol}`);
        continue;
      }

      const history = timestamps
        .map((timestamp, index) => {
          const close = quote.close?.[index];
          const open = quote.open?.[index];
          const high = quote.high?.[index];
          const low = quote.low?.[index];
          const volume = quote.volume?.[index] ?? 0;

          if (close == null || open == null || high == null || low == null) {
            return null;
          }

          return {
            date: new Date(timestamp * 1000).toISOString().split('T')[0],
            open: convertPrice(open, currency, targetCurrency),
            high: convertPrice(high, currency, targetCurrency),
            low: convertPrice(low, currency, targetCurrency),
            close: convertPrice(close, currency, targetCurrency),
            volume,
            currency: targetCurrency
          };
        })
        .filter(Boolean);

      if (history.length > 0) {
        return history;
      }

      lastError = new Error(`Yahoo history no data for ${yahooSymbol}`);
    } catch (error) {
      lastError = error;
      console.warn(`Yahoo historical fallback ${yahooSymbol} failed:`, error?.message || error);
      continue;
    }
  }

  if (lastError) {
    console.error(`Yahoo historical lookup failed for ${symbol}:`, lastError);
  }
  return [];
}

// Search for stocks - tries Finnhub (works for most markets)
export async function searchStocks(query) {
  try {
    ensureFinnhubKey();
    const response = await axios.get(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`
    );
    
    if (response?.data?.result) {
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

// Get stock price data - tries Oanor for Swedish stocks, then Yahoo for Stockholm stocks, then Finnhub
export async function getStockPrice(symbol, targetCurrency = 'SEK') {
  const normalizedSymbol = normalizeSymbol(symbol);
  const requestKey = `${normalizedSymbol}:${targetCurrency}`;

  if (pendingPriceRequests.has(requestKey)) {
    return pendingPriceRequests.get(requestKey);
  }

  const fetchPromise = (async () => {
    if (isNordicStock(normalizedSymbol)) {
      if (OANOR_API_KEY) {
        const oanorData = await getOanorStockData(normalizedSymbol);
        if (oanorData) {
          const price = oanorData.currency !== targetCurrency
            ? convertPrice(oanorData.price, oanorData.currency, targetCurrency)
            : oanorData.price;

          const change = oanorData.currency !== targetCurrency
            ? convertPrice(oanorData.change || 0, oanorData.currency, targetCurrency)
            : (oanorData.change || 0);

          return {
            symbol: oanorData.symbol,
            price,
            change,
            changePercent: oanorData.changePercent || 0,
            open: price - change,
            high: price + Math.abs(change) * 0.5,
            low: price - Math.abs(change) * 0.5,
            volume: 0,
            previousClose: price - change,
            lastUpdated: oanorData.lastUpdated,
            currency: targetCurrency,
            market: oanorData.market
          };
        }
      }

      const yahooQuote = await getYahooQuote(normalizedSymbol, targetCurrency);
      if (yahooQuote) {
        return yahooQuote;
      }
    }

    const tryFinnhubQuote = async (finnhubSymbol) => {
      ensureFinnhubKey();
      const response = await axios.get(
        `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(finnhubSymbol)}&token=${FINNHUB_API_KEY}`
      );
      const quote = response.data;

      if (!quote?.c) {
        return null;
      }

      const currentPrice = quote.c;
      const previousClose = quote.pc ?? 0;
      const convertedPrice = convertPrice(currentPrice, 'USD', targetCurrency);
      const convertedPreviousClose = convertPrice(previousClose, 'USD', targetCurrency);

      return {
        symbol: finnhubSymbol,
        price: convertedPrice,
        change: convertedPrice - convertedPreviousClose,
        changePercent: previousClose ? ((currentPrice - previousClose) / previousClose) * 100 : 0,
        open: convertPrice(quote.o, 'USD', targetCurrency),
        high: convertPrice(quote.h, 'USD', targetCurrency),
        low: convertPrice(quote.l, 'USD', targetCurrency),
        volume: 0,
        previousClose: convertedPreviousClose,
        lastUpdated: new Date().toISOString().split('T')[0],
        currency: targetCurrency
      };
    };

    try {
      const finnhubResult = await tryFinnhubQuote(normalizedSymbol);
      if (finnhubResult) {
        return finnhubResult;
      }

      if (isNordicStock(normalizedSymbol)) {
        const yahooQuote = await getYahooQuote(normalizedSymbol, targetCurrency);
        if (yahooQuote) {
          return yahooQuote;
        }
      }

      throw new Error(`Failed to get price for ${symbol}. Please try again later.`);
    } catch (error) {
      const isForbidden = error.response?.status === 403;
      const resolvedSymbol = await searchFinnhubSymbol(normalizedSymbol);

      if (resolvedSymbol && resolvedSymbol !== normalizedSymbol) {
        try {
          const fallbackResult = await tryFinnhubQuote(resolvedSymbol);
          if (fallbackResult) {
            return fallbackResult;
          }
        } catch (innerError) {
          console.error(`Failed Finnhub fallback with symbol ${resolvedSymbol}:`, innerError);
        }
      }

      if (isNordicStock(normalizedSymbol)) {
        const yahooQuote = await getYahooQuote(normalizedSymbol, targetCurrency);
        if (yahooQuote) {
          return yahooQuote;
        }
      }

      if (isForbidden) {
        throw new Error(
          `${symbol} - Access to Finnhub quote data is restricted. ` +
          `This may be caused by your Finnhub plan or token permissions.`
        );
      }

      throw new Error(`Failed to get price for ${symbol}. Please try again later.`);
    }
  })();

  pendingPriceRequests.set(requestKey, fetchPromise);
  fetchPromise.finally(() => pendingPriceRequests.delete(requestKey));
  return fetchPromise;
}

// Get historical data for charts - uses Finnhub with a Yahoo fallback for Stockholm symbols
export async function getHistoricalData(symbol, timeframe = 'daily', targetCurrency = 'SEK') {
  const normalizedSymbol = normalizeSymbol(symbol);

  if (isNordicStock(normalizedSymbol)) {
    const yahooHistory = await getYahooHistorical(normalizedSymbol, timeframe, targetCurrency);
    if (yahooHistory.length > 0) {
      return yahooHistory;
    }
  }

  try {
    const endDate = Math.floor(Date.now() / 1000);
    let startDate;
    let resolution;

    switch (timeframe) {
      case 'weekly':
        resolution = 'W';
        startDate = endDate - 90 * 24 * 60 * 60;
        break;
      case 'monthly':
        resolution = 'M';
        startDate = endDate - 365 * 24 * 60 * 60;
        break;
      case 'daily':
      default:
        resolution = 'D';
        startDate = endDate - 30 * 24 * 60 * 60;
        break;
    }

    ensureFinnhubKey();
    const response = await axios.get(
      `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(normalizedSymbol)}&resolution=${resolution}&from=${startDate}&to=${endDate}&token=${FINNHUB_API_KEY}`
    );

    if (response?.data?.s === 'ok' && response?.data?.t) {
      return response.data.t.map((timestamp, index) => ({
        date: new Date(timestamp * 1000).toISOString().split('T')[0],
        open: convertPrice(response.data.o[index], 'USD', targetCurrency),
        high: convertPrice(response.data.h[index], 'USD', targetCurrency),
        low: convertPrice(response.data.l[index], 'USD', targetCurrency),
        close: convertPrice(response.data.c[index], 'USD', targetCurrency),
        volume: response.data.v ? response.data.v[index] : 0,
        currency: targetCurrency
      }));
    }

    return [];
  } catch (error) {
    console.error('Error getting historical data from Finnhub:', error);

    const isForbidden = error.response?.status === 403;
    if (!isForbidden) {
      const resolvedSymbol = await searchFinnhubSymbol(normalizedSymbol);
      if (resolvedSymbol && resolvedSymbol !== normalizedSymbol) {
        try {
          const endDate = Math.floor(Date.now() / 1000);
          let startDate;
          let resolution;

          switch (timeframe) {
            case 'weekly':
              resolution = 'W';
              startDate = endDate - 90 * 24 * 60 * 60;
              break;
            case 'monthly':
              resolution = 'M';
              startDate = endDate - 365 * 24 * 60 * 60;
              break;
            case 'daily':
            default:
              resolution = 'D';
              startDate = endDate - 30 * 24 * 60 * 60;
              break;
          }

          const response = await axios.get(
            `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(resolvedSymbol)}&resolution=${resolution}&from=${startDate}&to=${endDate}&token=${FINNHUB_API_KEY}`
          );

          if (response?.data?.s === 'ok' && response?.data?.t) {
            return response.data.t.map((timestamp, index) => ({
              date: new Date(timestamp * 1000).toISOString().split('T')[0],
              open: convertPrice(response.data.o[index], 'USD', targetCurrency),
              high: convertPrice(response.data.h[index], 'USD', targetCurrency),
              low: convertPrice(response.data.l[index], 'USD', targetCurrency),
              close: convertPrice(response.data.c[index], 'USD', targetCurrency),
              volume: response.data.v ? response.data.v[index] : 0,
              currency: targetCurrency
            }));
          }
        } catch (innerError) {
          console.error(`Failed Finnhub historical fallback with symbol ${resolvedSymbol}:`, innerError);
        }
      }
    }

    if (isNordicStock(normalizedSymbol)) {
      const yahooHistory = await getYahooHistorical(normalizedSymbol, timeframe, targetCurrency);
      if (yahooHistory.length > 0) {
        return yahooHistory;
      }
    }

    if (isForbidden) {
      throw new Error(
        `${symbol} - Historical data not available. This may be caused by an invalid Finnhub API key, usage limits, or access restrictions for this symbol.`
      );
    }

    throw new Error(`Failed to get historical data for ${symbol}. Please try again later.`);
  }
}
