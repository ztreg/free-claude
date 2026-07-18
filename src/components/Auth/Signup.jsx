import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../../logo.png';
import './Auth.css';

function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await signUp(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/logo.png" alt="Logo" className="auth-logo-img" />
        </div>
        <h1>Create Account</h1>
        <p className="auth-subtitle">Start tracking your stocks today</p>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
          <div className="form-group">
            <label htmlFor="signup-username">Username</label>
            <input
              id="signup-username"
              name="signup-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Choose a username"
              autoComplete="off"
              readOnly
              onFocus={(e) => e.target.removeAttribute('readOnly')}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              name="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Create a password (min 6 characters)"
              autoComplete="new-password"
              readOnly
              onFocus={(e) => e.target.removeAttribute('readOnly')}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="signup-confirm">Confirm Password</label>
            <input
              id="signup-confirm"
              name="signup-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm your password"
              autoComplete="new-password"
              readOnly
              onFocus={(e) => e.target.removeAttribute('readOnly')}
            />
          </div>
          
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        
        <p className="auth-switch">
          Already have an account? <a href="/login">Sign in</a>
        </p>
      </div>
    </div>
  );
}

export default Signup;
