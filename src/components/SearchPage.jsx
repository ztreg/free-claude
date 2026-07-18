import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StockSearch from './StockSearch';
import Header from './Header';
import { addToWatchlist } from '../services/watchlistService';
import { useNotification } from '../context/NotificationContext';
import './SearchPage.css';

function SearchPage() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const handleAddStock = async (stock) => {
    try {
      await addToWatchlist(stock);
      showNotification(`${stock.symbol} added to watchlist!`, 'success');
    } catch (error) {
      showNotification(error.message || 'Failed to add stock', 'error');
    }
  };

  const handleViewWatchlist = () => {
    navigate('/dashboard');
  };

  return (
    <div className="search-page">
      <Header showNavButton={true} navButtonAction={handleViewWatchlist} navButtonText="My Watchlist" />

      <main className="search-page-main">
        <div className="search-intro">
          <h2>Find Stocks to Track</h2>
          <p>Search for stocks by company name or symbol. Click on results to inspect them before adding to your watchlist.</p>
        </div>

        <StockSearch onAddStock={handleAddStock} />
      </main>
    </div>
  );
}

export default SearchPage;