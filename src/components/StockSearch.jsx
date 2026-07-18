import { useState } from 'react';
import { searchStocks } from '../services/stockApi';
import './StockSearch.css';

function StockSearch({ onAddStock }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResults([]);

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
    setQuery('');
    setResults([]);
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
            {results.map((stock, index) => (
              <li key={index} className="result-item">
                <div className="stock-info">
                  <span className="stock-symbol">{stock.symbol}</span>
                  <span className="stock-name">{stock.name}</span>
                  <span className="stock-details">
                    {stock.region} • {stock.currency}
                  </span>
                </div>
                <button
                  onClick={() => handleAddStock(stock)}
                  className="add-button"
                >
                  + Add
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default StockSearch;
