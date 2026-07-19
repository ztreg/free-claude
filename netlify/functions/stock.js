function extractSymbolFromPath(path) {
  if (!path) return null;
  const cleaned = path.replace(/\/+$|^\/+/, '');
  const parts = cleaned.split('/');
  const stockIndex = parts.findIndex((segment) => segment === 'stock');
  if (stockIndex >= 0 && parts.length > stockIndex + 1) {
    return decodeURIComponent(parts.slice(stockIndex + 1).join('/'));
  }
  return null;
}

exports.handler = async function (event) {
  const pathSymbol = extractSymbolFromPath(event.path || event.rawPath);
  const symbol = event.queryStringParameters?.symbol || pathSymbol;
  const range = event.queryStringParameters?.range || '1d';
  const interval = event.queryStringParameters?.interval || '5m';

  if (!symbol) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required query parameter: symbol' })
    };
  }

  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`
    );
    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Yahoo proxy function error:', error);
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Failed to fetch stock data from Yahoo Finance' })
    };
  }
};
