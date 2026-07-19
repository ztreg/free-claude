import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../services/watchlistService';
import { getStockPrice } from '../services/stockApi';
import { useCurrency } from './CurrencyContext';
import { useNotification } from './NotificationContext';
import { useAuth } from './AuthContext';

const StockMarketContext = createContext(null);

export function useStockMarket() {
  const context = useContext(StockMarketContext);
  if (!context) {
    throw new Error('useStockMarket must be used within a StockMarketProvider');
  }
  return context;
}

export function StockMarketProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { currency } = useCurrency();
  const { showNotification } = useNotification();
  const [watchlist, setWatchlist] = useState([]);
  const [stockPrices, setStockPrices] = useState({});
  const [priceErrors, setPriceErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const [loadedUserId, setLoadedUserId] = useState(null);
  const initialPriceRefreshDone = useRef(false);

  const loadPrices = useCallback(
    async (stocks) => {
      if (!stocks || stocks.length === 0) {
        return { prices: {}, errors: {} };
      }

      const results = await Promise.all(
        stocks.map((stock) =>
          getStockPrice(stock.ticker, currency)
            .then((price) => {
              if (price == null) {
                throw new Error('No price data returned');
              }
              return { ticker: stock.ticker, price };
            })
            .catch((error) => ({ ticker: stock.ticker, error }))
        )
      );

      const prices = {};
      const errors = {};
      results.forEach((result) => {
        if (result.error) {
          const message = result.error?.message || 'Failed to load price';
          errors[result.ticker] = message;
          console.error(`Error loading price for ${result.ticker}:`, result.error);
          showNotification(`Failed to load price for ${result.ticker}.`, 'error', 5000);
        } else {
          prices[result.ticker] = result.price;
        }
      });

      return { prices, errors };
    },
    [currency, showNotification]
  );

  const loadWatchlist = useCallback(async () => {
    if (!user) {
      setWatchlist([]);
      setStockPrices({});
      setLoadedUserId(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const stocks = await getWatchlist();
      setWatchlist(stocks);
      const { prices, errors } = await loadPrices(stocks);
      setStockPrices(prices);
      setPriceErrors(errors);
      setLoadedUserId(user.id);
    } catch (error) {
      console.error('Error loading watchlist:', error);
      showNotification('Failed to load your watchlist. Please try again later.', 'error', 5000);
    } finally {
      setLoading(false);
    }
  }, [loadPrices, showNotification, user]);

  useEffect(() => {
    if (authLoading || !user || loadedUserId === user.id) {
      return;
    }

    loadWatchlist();
  }, [authLoading, user, loadedUserId, loadWatchlist]);

  useEffect(() => {
    if (!user || watchlist.length === 0) {
      return;
    }

    if (!initialPriceRefreshDone.current) {
      initialPriceRefreshDone.current = true;
      return;
    }

    setRefreshingPrices(true);
    loadPrices(watchlist)
      .then(({ prices, errors }) => {
        setStockPrices(prices);
        setPriceErrors(errors);
      })
      .finally(() => setRefreshingPrices(false));
  }, [currency, user, watchlist, loadPrices]);

  const addStockToWatchlist = useCallback(
    async (stock) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const addedStock = await addToWatchlist(stock);
      setWatchlist((prev) => [addedStock, ...prev]);
      setPriceErrors((prev) => {
        const next = { ...prev };
        delete next[addedStock.ticker];
        return next;
      });

      try {
        const price = await getStockPrice(addedStock.ticker, currency);
        setStockPrices((prev) => ({ ...prev, [addedStock.ticker]: price }));
      } catch (error) {
        console.error(`Error loading price for ${addedStock.ticker}:`, error);
        setPriceErrors((prev) => ({
          ...prev,
          [addedStock.ticker]: error?.message || 'Failed to load price'
        }));
        showNotification(`Added ${addedStock.ticker} but failed to load price.`, 'warning', 5000);
      }

      return addedStock;
    },
    [currency, showNotification, user]
  );

  const removeStockFromWatchlist = useCallback(
    async (ticker) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      await removeFromWatchlist(ticker);
      setWatchlist((prev) => prev.filter((stock) => stock.ticker !== ticker));
      setStockPrices((prev) => {
        const next = { ...prev };
        delete next[ticker];
        return next;
      });
      setPriceErrors((prev) => {
        const next = { ...prev };
        delete next[ticker];
        return next;
      });
    },
    [user]
  );

  const isStockInWatchlist = useCallback(
    (symbol) => watchlist.some((stock) => stock.ticker === symbol),
    [watchlist]
  );

  const getPrice = useCallback(
    (ticker) => stockPrices[ticker] || null,
    [stockPrices]
  );

  const value = useMemo(
    () => ({
      watchlist,
      stockPrices,
      priceErrors,
      loading,
      refreshingPrices,
      addStockToWatchlist,
      removeStockFromWatchlist,
      refreshWatchlist: loadWatchlist,
      isStockInWatchlist,
      getPrice,
    }),
    [
      watchlist,
      stockPrices,
      priceErrors,
      loading,
      refreshingPrices,
      addStockToWatchlist,
      removeStockFromWatchlist,
      loadWatchlist,
      isStockInWatchlist,
      getPrice,
    ]
  );

  return (
    <StockMarketContext.Provider value={value}>
      {children}
    </StockMarketContext.Provider>
  );
}
