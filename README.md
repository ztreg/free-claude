# TompaStocks

A modern stock tracking application built with React, Vite, and Supabase. Track your favorite stocks, view real-time prices, and analyze performance with interactive charts.

## Features

- 🔐 Custom username/password authentication (no email required)
- 📊 Real-time stock prices and market data
- 🇸🇪 **Swedish stock support** (via optional Oanor API)
- 🇺🇸 US/International stock support via Finnhub API
- 📈 Interactive charts with multiple timeframes
- 👀 Personalized watchlist management
- 💱 Multi-currency support (SEK, USD, EUR, GBP)
- 🎨 Modern, responsive design
- 🚀 Ready for deployment on free hosting platforms

## Tech Stack

- **Frontend**: React 18, Vite
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Charts**: Recharts
- **Routing**: React Router
- **Stock Data**: 
  - **Swedish**: Oanor API (optional, 100 calls/month free)
  - **US/International**: Finnhub API (free tier available)

## Prerequisites

- Node.js 16+ and npm
- Free Supabase account
- **Optional**: Free Finnhub API key (for US/International stocks)
- **Optional**: Free Oanor API key (for Swedish stocks - 100 calls/month free)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

Follow the detailed setup guide in [SUPABASE_SETUP.md](SUPABASE_SETUP.md):

1. Create a free Supabase project
2. Get your API credentials
3. Configure environment variables
4. Set up authentication
5. Create database tables

### 3. Configure Stock API (Optional)

The app works out of the box with basic functionality. For full stock data support:

**For Swedish stocks (VOLV-B.ST, etc.):**
1. Get a free Oanor API key from [https://oanor.com](https://www.oanor.com/api/sweden-stock-api)
2. Add it to your `.env` file:
   ```
   VITE_OANOR_API_KEY=your_actual_api_key
   ```
   - Free tier: 100 calls/month
   - Provides real-time Swedish stock data in SEK

**For US/International stocks (AAPL, GOOGL, etc.):**
1. Get a free Finnhub API key from [https://finnhub.io/](https://finnhub.io/)
2. Add it to your `.env` file:
   ```
   VITE_FINNHUB_API_KEY=your_actual_api_key
   ```
   - Free tier: 60 calls/minute (86,400/day)

**Note**: The app will work with limited functionality without API keys, but full stock data requires at least one API key.

### 4. Start Development

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## Project Structure

```
.
├── src/
│   ├── components/
│   │   ├── Auth/          # Authentication components
│   │   ├── Dashboard.jsx  # Main dashboard
│   │   ├── StockSearch.jsx
│   │   └── StockChart.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── services/
│   │   ├── stockApi.js    # Stock data API
│   │   └── watchlistService.js
│   ├── lib/
│   │   └── supabaseClient.js
│   ├── config/
│   │   └── supabase.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── SUPABASE_SETUP.md
├── package.json
└── vite.config.js
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Deployment

### Netlify (Recommended)

1. Run `npm run build`
2. Go to [netlify.com](https://netlify.com) and sign up/login
3. Drag and drop the `dist` folder into the "Sites" area
4. Your site will be live instantly!

### Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign up/login
3. Click "New Project" and import your GitHub repository
4. Vercel will automatically detect the Vite configuration
5. Click "Deploy"

### Environment Variables

When deploying, make sure to add your environment variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Usage

1. **Sign Up**: Create an account with your desired username and password
2. **Search Stocks**: Use the search bar to find stocks by symbol or company name
3. **Add to Watchlist**: Click "Search" to track stocks
4. **View Dashboard**: See all your followed stocks with current prices
5. **Analyze**: Click on any stock to view detailed charts and performance
6. **Select Currency**: Use the currency dropdown in the header to switch between SEK, USD, EUR, GBP

**Note**: 
- Configure the Oanor API key for Swedish stocks (VOLV-B.ST, etc.) in SEK
- Configure the Finnhub API key for US/International stocks (AAPL, GOOGL, etc.)
- The currency selector converts stock prices to your preferred currency

## Features in Detail

### Authentication
- Custom username/password system (no email required)
- Secure session management via Supabase
- Protected routes for authenticated users

### Stock Data
- Real-time price updates (via Oanor API for Swedish stocks, Finnhub for others)
- Historical data for charts
- Support for multiple timeframes (daily, weekly, monthly)
- Swedish stocks: Oanor API (100 calls/month free)
- US/International stocks: Finnhub API (86,400 calls/day free)
- Currency conversion for displaying prices in SEK, EUR, GBP, etc.

### Watchlist Management
- Add/remove stocks from your watchlist
- Persistent storage in Supabase database
- Quick overview of all tracked stocks
- Real-time price updates

### Interactive Charts
- Beautiful line charts powered by Recharts
- Multiple timeframe options
- Key statistics (high, low, average)
- Responsive design for all screen sizes

## Troubleshooting

### Supabase Connection Issues
- Verify your environment variables are set correctly
- Check that your Supabase project is active
- Ensure Row Level Security policies are configured

### Stock API Issues
- For Swedish stocks: Get a free Oanor API key from oanor.com (100 calls/month)
- For US/International stocks: Get a free Finnhub API key from finnhub.io (86,400 calls/day)
- **403 Error**: This typically means incorrect symbol format or missing API key
- Swedish stocks should use format like VOLV-B.ST (with hyphen, not space)
- The currency selector converts stock prices to your preferred currency (SEK, EUR, etc.)

### Build Errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check that all dependencies are installed
- Verify Node.js version is 16+

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Acknowledgments

- Stock data provided by Finnhub
- Authentication and database powered by Supabase
- Charts built with Recharts
- Built with React and Vite
