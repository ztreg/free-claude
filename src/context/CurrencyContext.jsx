import { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    // Load from localStorage or default to SEK (for Swedish stock app)
    const saved = localStorage.getItem('currency');
    return saved || 'SEK';
  });

  useEffect(() => {
    // Save to localStorage whenever currency changes
    localStorage.setItem('currency', currency);
  }, [currency]);

  const currencySymbols = {
    USD: '$',
    SEK: 'kr',
    EUR: '€',
    GBP: '£'
  };

  const formatPrice = (price, currentCurrency = currency) => {
    const symbol = currencySymbols[currentCurrency] || currentCurrency;
    return `${price.toFixed(2)} ${symbol}`;
  };

  const value = {
    currency,
    setCurrency,
    formatPrice,
    currencySymbols
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};