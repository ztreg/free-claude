import { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useCurrency } from '../context/CurrencyContext';
import { useNavigate } from 'react-router-dom';
import { useStockMarket } from '../context/StockMarketContext';
import StockChart from './StockChart';
import Header from './Header';
import './Dashboard.css';

function Dashboard() {
  const { showNotification } = useNotification();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const {
    watchlist,
    stockPrices,
    priceErrors,
    loading,
    refreshingPrices,
    removeStockFromWatchlist,
  } = useStockMarket();
  const [selectedStock, setSelectedStock] = useState(null);
  const [showChart, setShowChart] = useState(false);

  const handleNavigateToSearch = () => {
    navigate('/search');
  };

  const handleRemoveStock = async (ticker) => {
    try {
      await removeStockFromWatchlist(ticker);
      if (selectedStock?.ticker === ticker) {
        setSelectedStock(null);
      }
      showNotification(`${ticker} removed from watchlist`, 'success', 5000);
    } catch {
      showNotification('Failed to remove stock', 'error', 5000);
    }
  };

  const handleStockClick = (stock) => {
    setSelectedStock(stock);
  };

  let watchlistContent;
  if (loading) {
    watchlistContent = <div className="loading">Loading your watchlist...</div>;
  } else if (watchlist.length === 0) {
    watchlistContent = (
      <div className="empty-state">
        <p>No stocks in your watchlist yet.</p>
        <p>Use the "Search Stocks" button in the header to get started!</p>
      </div>
    );
  } else {
    watchlistContent = (
      <div className="watchlist-grid">
        {watchlist.map((stock) => {
          const price = stockPrices[stock.ticker];
          return (
            <div key={stock.ticker} className="stock-card">
              <button
                type="button"
                className="stock-card-button"
                onClick={() => handleStockClick(stock)}
              >
                <div className="stock-card-header">
                  <h3>{stock.ticker}</h3>
                </div>
                <p className="company-name">{stock.company_name || stock.ticker}</p>
                {(() => {
                  if (price) {
                    return (
                      <div className="stock-price">
                        <span className="current-price">{formatPrice(price.price)}</span>
                        <span className={`price-change ${price.change >= 0 ? 'positive' : 'negative'}`}>
                          {price.change >= 0 ? '+' : ''}{formatPrice(price.change)} ({price.changePercent.toFixed(2)}%)
                        </span>
                      </div>
                    );
                  }

                  if (priceErrors[stock.ticker]) {
                    return <div className="stock-price error-price">Price unavailable</div>;
                  }

                  return <div className="stock-price loading-price">Loading price...</div>;
                })()}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveStock(stock.ticker);
                }}
                className="remove-button"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Header title="Tompa Stocks" showNavButton={true} navButtonAction={handleNavigateToSearch} navButtonText="Search Stocks" />

      <main className="dashboard-main">
        <div className="dashboard-content">
          <section className="watchlist-section">
            <div className="watchlist-header">
              <div>
                <h2>My Watchlist</h2>
                {refreshingPrices && (
                  <p className="watchlist-subtitle">Refreshing prices...</p>
                )}
              </div>
            </div>
            {watchlistContent}
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
            {(() => {
              const selectedPrice = stockPrices[selectedStock.ticker];
              if (selectedPrice) {
                return (
                  <div className="detail-price">
                    <span className="detail-current-price">
                      {formatPrice(selectedPrice.price)}
                    </span>
                    <span className={`detail-change ${selectedPrice.change >= 0 ? 'positive' : 'negative'}`}>
                      {selectedPrice.change >= 0 ? '+' : ''}{formatPrice(selectedPrice.change)} 
                      ({selectedPrice.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                );
              }

              if (priceErrors[selectedStock.ticker]) {
                return <div className="detail-price error-price">Price unavailable</div>;
              }

              return <div className="detail-price loading-price">Loading price...</div>;
            })()}
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
