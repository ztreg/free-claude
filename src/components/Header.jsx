import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { useCurrency } from '../context/CurrencyContext';
import './Header.css';

function Header({ title, showNavButton = false, navButtonAction = null, navButtonText = '' }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { currency, setCurrency, currencySymbols } = useCurrency();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
      setShowDropdown(false);
    } catch (error) {
      showNotification('Failed to sign out', 'error', 5000);
      console.error('Sign out error:', error);
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const toggleCurrencyDropdown = () => {
    setShowCurrencyDropdown(!showCurrencyDropdown);
  };

  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
    setShowCurrencyDropdown(false);
    showNotification(`Currency changed to ${newCurrency}`, 'success', 3000);
  };

  const handleClickOutside = (e) => {
    if (!e.target.closest('.user-menu')) {
      setShowDropdown(false);
    }
    if (!e.target.closest('.currency-selector')) {
      setShowCurrencyDropdown(false);
    }
  };

  useEffect(() => {
    if (showDropdown || showCurrencyDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDropdown, showCurrencyDropdown]);

  return (
    <header className="header">
      <div className="header-left">
        <a href="/dashboard" className="logo-link">
          <img src="/logo.png" alt="Logo" className="logo" />
        </a>
        <h1>{title}</h1>
      </div>
      <div className="header-right">
        {showNavButton && navButtonAction && (
          <button onClick={navButtonAction} className="header-nav-button">
            {navButtonText}
          </button>
        )}
        <div className="currency-selector">
          <button onClick={toggleCurrencyDropdown} className="currency-button">
            {currencySymbols[currency] || currency} {currency}
            <span className="dropdown-arrow">▼</span>
          </button>
          {showCurrencyDropdown && (
            <div className="currency-dropdown">
              {Object.keys(currencySymbols).map((curr) => (
                <button
                  key={curr}
                  onClick={() => handleCurrencyChange(curr)}
                  className={`currency-option ${currency === curr ? 'active' : ''}`}
                >
                  {currencySymbols[curr]} {curr}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="user-menu">
          <button onClick={toggleDropdown} className="user-menu-button">
            {user?.email?.split('@')[0] || 'User'}
            <span className="dropdown-arrow">▼</span>
          </button>
          {showDropdown && (
            <div className="dropdown-menu">
              <button onClick={handleSignOut} className="dropdown-item">
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;