import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import StockChart from './StockChart';
import Header from './Header';
import { getWatchlist, removeFromWatchlist, addToWatchlist } from '../services/watchlistService';
import { getStockPrice } from '../services/stockApi';
import './Dashboard.css';

function Dashboard() {
  const { user, signOut } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState([]);
  const [stockPrices, setStockPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState(null);
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    try {
      const stocks = await getWatchlist();
      setWatchlist(stocks);
      
      // Load prices for all stocks
      const prices = {};
      for (const stock of stocks) {
        try {
          const price = await getStockPrice(stock.ticker);
          prices[stock.ticker] = price;
        } catch (error) {
          console.error(`Error loading price for ${stock.ticker}:`, error);
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
      showNotification(`${ticker} removed from watchlist`, 'success');
    } catch (error) {
      showNotification('Failed to remove stock', 'error');
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
                          <span className="current-price">${price.price.toFixed(2)}</span>
                          <span className={`price-change ${price.change >= 0 ? 'positive' : 'negative'}`}>
                            {price.change >= 0 ? '+' : ''}{price.change.toFixed(2)} ({price.changePercent.toFixed(2)}%)
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
                  ${stockPrices[selectedStock.ticker].price.toFixed(2)}
                </span>
                <span className={`detail-change ${stockPrices[selectedStock.ticker].change >= 0 ? 'positive' : 'negative'}`}>
                  {stockPrices[selectedStock.ticker].change >= 0 ? '+' : ''}{stockPrices[selectedStock.ticker].change.toFixed(2)} 
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
