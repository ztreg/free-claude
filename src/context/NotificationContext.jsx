import { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notification, setNotification] = useState(null);

  const showNotification = useCallback((message, type = 'success', duration = 3000) => {
    setNotification({ message, type, duration });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      {notification && (
        <Snackbar
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
          duration={notification.duration}
        />
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}