import { useState } from 'react';
import { searchStocks, getStockPrice } from '../services/stockApi';
import './StockSearch.css';

function StockSearch({ onAddStock, watchlist }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inspectingStock, setInspectingStock] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  const isStockInWatchlist = (symbol) => {
    return watchlist.some(stock => stock.ticker === symbol);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResults([]);
    setInspectingStock(null);

    try {
      const stocks = await searchStocks(query);
      setResults(stocks);
      
      if (stocks.length === 0) {
        setError('No stocks found. Try a different search term.');
      }
    } catch (err) {
      setError('Failed to search stocks. Please try again.');
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
      const priceData = await getStockPrice(stock.symbol);
      setInspectingStock({ ...stock, priceData });
    } catch (err) {
      console.error('Error loading stock price:', err);
      setInspectingStock({ ...stock, priceData: null });
    } finally {
      setLoadingPrice(false);
    }
  };

  const closeInspection = () => {
    setInspectingStock(null);
  };

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
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <div className="search-error">{error}</div>}

      {results.length > 0 && (
        <div className="search-results">
          <h3>Search Results</h3>
          <ul className="results-list">
            {results.map((stock, index) => {
              const isInWatchlist = isStockInWatchlist(stock.symbol);
              return (
                <li key={index} className="result-item">
                  <div 
                    className="stock-info clickable"
                    onClick={() => handleInspectStock(stock)}
                  >
                    <span className="stock-symbol">{stock.symbol}</span>
                    <span className="stock-name">{stock.name}</span>
                    {stock.type && (
                      <span className="stock-details">
                        {stock.type}
                      </span>
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
              <button onClick={closeInspection} className="close-button">×</button>
            </div>
            <p className="inspection-company">{inspectingStock.name}</p>
            
            {loadingPrice ? (
              <div className="inspection-loading">Loading price data...</div>
            ) : inspectingStock.priceData ? (
              <div className="inspection-price">
                <span className="inspection-current-price">
                  ${inspectingStock.priceData.price.toFixed(2)}
                </span>
                <span className={`inspection-change ${inspectingStock.priceData.change >= 0 ? 'positive' : 'negative'}`}>
                  {inspectingStock.priceData.change >= 0 ? '+' : ''}{inspectingStock.priceData.change.toFixed(2)} 
                  ({inspectingStock.priceData.changePercent.toFixed(2)}%)
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
