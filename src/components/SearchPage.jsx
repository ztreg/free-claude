import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StockSearch from './StockSearch';
import Header from './Header';
import { addToWatchlist, getWatchlist } from '../services/watchlistService';
import { useNotification } from '../context/NotificationContext';
import './SearchPage.css';

function SearchPage() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [watchlist, setWatchlist] = useState([]);

  const loadWatchlist = async () => {
    try {
      const stocks = await getWatchlist();
      setWatchlist(stocks);
    } catch (error) {
      console.error('Error loading watchlist:', error);
    }
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  const handleAddStock = async (stock) => {
    try {
      await addToWatchlist(stock);
      await loadWatchlist(); // Reload to update UI checkboxes
      showNotification(`${stock.symbol} added to watchlist!`, 'success', 5000);
    } catch (error) {
      if (error.message === 'Stock already in watchlist') {
        showNotification(`${stock.symbol} is already in your watchlist`, 'warning', 5000);
      } else {
        showNotification(error.message || 'Failed to add stock', 'error', 5000);
      }
    }
  };

  const handleViewWatchlist = () => {
    navigate('/dashboard');
  };

  return (
    <div className="search-page">
      <Header title="Stock Search" showNavButton={true} navButtonAction={handleViewWatchlist} navButtonText="My Watchlist" />

      <main className="search-page-main">
        <div className="search-intro">
          <h2>Find Stocks to Track</h2>
          <p>Search for stocks by company name or symbol. Click on results to inspect them before adding to your watchlist.</p>
        </div>

        <StockSearch onAddStock={handleAddStock} watchlist={watchlist} />
      </main>
    </div>
  );
}

export default SearchPage;