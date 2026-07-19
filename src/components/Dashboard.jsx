import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useCurrency } from '../context/CurrencyContext';
import { useNavigate } from 'react-router-dom';
import StockChart from './StockChart';
import Header from './Header';
import { getWatchlist, removeFromWatchlist, addToWatchlist } from '../services/watchlistService';
import { getStockPrice } from '../services/stockApi';
import './Dashboard.css';

function Dashboard() {
  const { user, signOut } = useAuth();
  const { showNotification } = useNotification();
  const { currency, formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState([]);
  const [stockPrices, setStockPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState(null);
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    loadWatchlist();
  }, []);

  useEffect(() => {
    // Reload prices when currency changes
    if (watchlist.length > 0) {
      loadWatchlist();
    }
  }, [currency]);

  const loadWatchlist = async () => {
    try {
      const stocks = await getWatchlist();
      setWatchlist(stocks);
      
      // Load prices for all stocks
      const prices = {};
      for (const stock of stocks) {
        try {
          const price = await getStockPrice(stock.ticker, currency);
          prices[stock.ticker] = price;
        } catch (error) {
          console.error(`Error loading price for ${stock.ticker}:`, error);
          showNotification(`Failed to load price for ${stock.ticker}, "I need to find another API" `, 'error', 5000);
        }
      }
      setStockPrices(prices);
    } catch (error) {
      console.error('Error loading watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToSearch = () => {
    navigate('/search');
  };

  const handleRemoveStock = async (ticker) => {
    try {
      await removeFromWatchlist(ticker);
      await loadWatchlist();
      if (selectedStock?.ticker === ticker) {
        setSelectedStock(null);
      }
      showNotification(`${ticker} removed from watchlist`, 'success', 5000);
    } catch (error) {
      showNotification('Failed to remove stock', 'error', 5000);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleStockClick = (stock) => {
    setSelectedStock(stock);
  };

  return (
    <div className="dashboard">
      <Header title="Tompa Stocks" showNavButton={true} navButtonAction={handleNavigateToSearch} navButtonText="Search Stocks" />

      <main className="dashboard-main">
        <div className="dashboard-content">
          <section className="watchlist-section">
            <div className="watchlist-header">
              <h2>My Watchlist</h2>
            </div>
            {loading ? (
              <div className="loading">Loading your watchlist...</div>
            ) : watchlist.length === 0 ? (
              <div className="empty-state">
                <p>No stocks in your watchlist yet.</p>
                <p>Use the "Search Stocks" button in the header to get started!</p>
              </div>
            ) : (
              <div className="watchlist-grid">
                {watchlist.map((stock) => {
                  const price = stockPrices[stock.ticker];
                  return (
                    <div
                      key={stock.ticker}
                      className="stock-card"
                      onClick={() => handleStockClick(stock)}
                    >
                      <div className="stock-card-header">
                        <h3>{stock.ticker}</h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveStock(stock.ticker);
                          }}
                          className="remove-button"
                        >
                          ×
                        </button>
                      </div>
                      <p className="company-name">{stock.company_name || stock.ticker}</p>
                      {price ? (
                        <div className="stock-price">
                          <span className="current-price">{formatPrice(price.price)}</span>
                          <span className={`price-change ${price.change >= 0 ? 'positive' : 'negative'}`}>
                            {price.change >= 0 ? '+' : ''}{formatPrice(price.change)} ({price.changePercent.toFixed(2)}%)
                          </span>
                        </div>
                      ) : (
                        <div className="stock-price loading-price">Loading price...</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {selectedStock && (
          <aside className="stock-detail">
            <div className="detail-header">
              <h2>{selectedStock.ticker}</h2>
              <button
                onClick={() => setSelectedStock(null)}
                className="close-button"
              >
                ×
              </button>
            </div>
            <p className="detail-company">{selectedStock.company_name || selectedStock.ticker}</p>
            {stockPrices[selectedStock.ticker] && (
              <div className="detail-price">
                <span className="detail-current-price">
                  {formatPrice(stockPrices[selectedStock.ticker].price)}
                </span>
                <span className={`detail-change ${stockPrices[selectedStock.ticker].change >= 0 ? 'positive' : 'negative'}`}>
                  {stockPrices[selectedStock.ticker].change >= 0 ? '+' : ''}{formatPrice(stockPrices[selectedStock.ticker].change)} 
                  ({stockPrices[selectedStock.ticker].changePercent.toFixed(2)}%)
                </span>
              </div>
            )}
            <div className="detail-actions">
              <button 
                onClick={() => setShowChart(true)}
                className="view-chart-button"
              >
                View Chart
              </button>
            </div>
          </aside>
        )}
      </main>

      {showChart && selectedStock && (
        <StockChart 
          symbol={selectedStock.ticker} 
          onClose={() => setShowChart(false)} 
        />
      )}
    </div>
  );
}

export default Dashboard;
