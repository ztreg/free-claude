import { useEffect } from 'react';
import './Snackbar.css';

function Snackbar({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`snackbar snackbar-${type}`}>
      <span className="snackbar-message">{message}</span>
      <button onClick={onClose} className="snackbar-close">×</button>
    </div>
  );
}

export default Snackbar;