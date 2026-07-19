exports.handler = async function (event) {
  const symbol = event.queryStringParameters?.symbol;
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
