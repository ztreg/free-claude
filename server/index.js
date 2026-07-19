const express = require('express');

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/api/stock/:symbol', async (req, res) => {
  const symbol = req.params.symbol;
  const range = req.query.range || '1d';
  const interval = req.query.interval || '5m';

  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Yahoo backend proxy error:', error);
    res.status(502).json({ error: 'Failed to fetch stock data from Yahoo Finance' });
  }
});

app.listen(PORT, () => {
  console.log(`Yahoo backend proxy running on http://localhost:${PORT}`);
});
