import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getHistoricalData } from '../services/stockApi';
import { useNotification } from '../context/NotificationContext';
import { useCurrency } from '../context/CurrencyContext';
import './StockChart.css';

function StockChart({ symbol, onClose }) {
  const { showNotification } = useNotification();
  const { currency, formatPrice } = useCurrency();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState('daily');

  useEffect(() => {
    loadHistoricalData();
  }, [symbol, timeframe, currency]);

  const roundChartValue = (value) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return value;
    }
    return Number(value.toFixed(2));
  };

  const loadHistoricalData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const historicalData = await getHistoricalData(symbol, timeframe, currency);
      setData(
        historicalData.map((row) => ({
          ...row,
          open: roundChartValue(row.open),
          high: roundChartValue(row.high),
          low: roundChartValue(row.low),
          close: roundChartValue(row.close)
        }))
      );
    } catch (err) {
      const message = err?.message || 'Failed to load historical data';
      setError(message);
      showNotification(`Failed to load historical data for ${symbol}: ${message}`, 'error', 5000);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatXAxis = (tickItem) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTooltip = (value, name) => {
    if (name === 'close') {
      return [formatPrice(roundChartValue(value)), 'Close Price'];
    }
    return [roundChartValue(value), name];
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const renderChartBody = () => {
    if (loading) {
      return <div className="chart-loading">Loading chart data...</div>;
    }
    if (error) {
      return <div className="chart-error">{error}</div>;
    }
    if (data.length === 0) {
      return <div className="chart-error">No historical data available</div>;
    }

    return (
      <div className="chart-content">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              stroke="#666"
              fontSize={12}
            />
            <YAxis
              tickFormatter={(value) => {
                const formatted = formatPrice(value);
                return formatted.replace(/\.\d+$/, '');
              }}
              stroke="#666"
              fontSize={12}
            />
            <Tooltip
              formatter={formatTooltip}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="close"
              stroke="#667eea"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
              name="Close Price"
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="chart-stats">
          <div className="stat">
            <span className="stat-label">Period</span>
            <span className="stat-value">{data.length} {timeframe} periods</span>
          </div>
          <div className="stat">
            <span className="stat-label">Highest</span>
            <span className="stat-value">{formatPrice(Math.max(...data.map((d) => d.high)))}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Lowest</span>
            <span className="stat-value">{formatPrice(Math.min(...data.map((d) => d.low)))}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Average</span>
            <span className="stat-value">{formatPrice(data.reduce((sum, d) => sum + d.close, 0) / data.length)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="stock-chart-modal">
      <div className="chart-container">
        <div className="chart-header">
          <h2>{symbol} - {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Chart</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        <div className="timeframe-selector">
          {['daily', 'weekly', 'monthly'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`timeframe-button ${timeframe === tf ? 'active' : ''}`}
            >
              {tf.charAt(0).toUpperCase() + tf.slice(1)}
            </button>
          ))}
        </div>

        {renderChartBody()}
      </div>
    </div>
  );
}

export default StockChart;
