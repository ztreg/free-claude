import { useState, useEffect } from "react";
import { searchStocks, getStockPrice } from "../services/stockApi";
import { useNotification } from "../context/NotificationContext";
import { useCurrency } from "../context/CurrencyContext";
import "./StockSearch.css";

function StockSearch({ onAddStock, watchlist }) {
  const { showNotification } = useNotification();
  const { currency, formatPrice } = useCurrency();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [resultPrices, setResultPrices] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingResultPrices, setLoadingResultPrices] = useState(false);
  const [error, setError] = useState("");
  const [inspectingStock, setInspectingStock] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  const isStockInWatchlist = (symbol) => {
    return watchlist.some((stock) => stock.ticker === symbol);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setResults([]);
    setInspectingStock(null);

    try {
      const stocks = await searchStocks(query);
      setResults(stocks);

      if (stocks.length === 0) {
        setError("No stocks found. Try a different search term.");
      }
    } catch (err) {
      showNotification(
        "Failed to search stocks. Please try again.",
        "error",
        5000,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = (stock) => {
    onAddStock(stock);
    // Don't clear results - let user add more stocks from same search
    setInspectingStock(null);
  };

  const handleInspectStock = async (stock) => {
    setInspectingStock(stock);
    setLoadingPrice(true);

    try {
      const priceData = await getStockPrice(stock.symbol, currency);
      setInspectingStock({ ...stock, priceData });
    } catch (err) {
      console.error("Error loading stock price:", err);
      showNotification(
        `Failed to load price for ${stock.symbol}`,
        "error",
        5000,
      );
      setInspectingStock({ ...stock, priceData: null });
    } finally {
      setLoadingPrice(false);
    }
  };

  const closeInspection = () => {
    setInspectingStock(null);
  };

  useEffect(() => {
    const loadResultPrices = async (stocks) => {
      if (!stocks || stocks.length === 0) {
        setResultPrices({});
        return;
      }

      setLoadingResultPrices(true);
      const prices = {};
      const items = stocks.slice(0, 8);

      await Promise.all(
        items.map(async (stock) => {
          try {
            prices[stock.symbol] = await getStockPrice(stock.symbol, currency);
          } catch (err) {
            console.warn(`Price lookup failed for ${stock.symbol}:`, err);
            prices[stock.symbol] = null;
          }
        }),
      );

      setResultPrices(prices);
      setLoadingResultPrices(false);
    };

    loadResultPrices(results);
  }, [results, currency]);

  return (
    <div className="stock-search">
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for stocks (e.g., AAPL, Apple)"
          className="search-input"
        />
        <button type="submit" disabled={loading} className="search-button">
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && <div className="search-error">{error}</div>}

      {results.length > 0 && (
        <div className="search-results">
          <h3>Search Results</h3>
          <ul className="results-list">
            {results.map((stock, i) => {
              const isInWatchlist = isStockInWatchlist(stock.symbol);
              const searchPrice = resultPrices[stock.symbol];
              return (
                <li key={i} className="result-item">
                  <div
                    className="stock-info clickable"
                    onClick={() => handleInspectStock(stock)}
                  >
                    <div className="stock-top-row">
                      <span className="stock-symbol">{stock.symbol}</span>
                    </div>
                    <span className="stock-name">
                      {stock.name}
                      <span className="stock-price">
                        {searchPrice?.price != null
                          ? formatPrice(searchPrice.price)
                          : loadingResultPrices
                            ? "Loading…"
                            : "No price"}
                      </span>
                    </span>
                    {stock.type && (
                      <span className="stock-details">{stock.type}</span>
                    )}
                  </div>

                  {isInWatchlist ? (
                    <div className="tracked-indicator">
                      <span className="checkmark">✓</span>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddStock(stock);
                      }}
                      className="add-button"
                    >
                      + Add
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {inspectingStock && (
        <div className="stock-inspection-modal">
          <div className="inspection-content">
            <div className="inspection-header">
              <h2>{inspectingStock.symbol}</h2>
              <button onClick={closeInspection} className="close-button">
                ×
              </button>
            </div>
            <p className="inspection-company">{inspectingStock.name}</p>

            {loadingPrice ? (
              <div className="inspection-loading">Loading price data...</div>
            ) : inspectingStock.priceData ? (
              <div className="inspection-price">
                <span className="inspection-current-price">
                  {formatPrice(inspectingStock.priceData.price)}
                </span>
                <span
                  className={`inspection-change ${inspectingStock.priceData.change >= 0 ? "positive" : "negative"}`}
                >
                  {inspectingStock.priceData.change >= 0 ? "+" : ""}
                  {formatPrice(inspectingStock.priceData.change)}(
                  {inspectingStock.priceData.changePercent.toFixed(2)}%)
                </span>
              </div>
            ) : (
              <div className="inspection-error">Price data unavailable</div>
            )}

            <div className="inspection-actions">
              {isStockInWatchlist(inspectingStock.symbol) ? (
                <div className="tracked-status">
                  <span className="checkmark-large">✓</span>
                  <span>Already in watchlist</span>
                </div>
              ) : (
                <button
                  onClick={() => handleAddStock(inspectingStock)}
                  className="inspection-add-button"
                >
                  Add to Watchlist
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StockSearch;
