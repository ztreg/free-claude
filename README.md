# TompaStocks

A modern stock tracking application built with React, Vite, and Supabase. Track your favorite stocks, view real-time prices, and analyze performance with interactive charts.

## Features

- 🔐 Custom username/password authentication (no email required)
- 📊 Real-time stock prices and market data
- 📈 Interactive charts with multiple timeframes
- 👀 Personalized watchlist management
- 🎨 Modern, responsive design
- 🚀 Ready for deployment on free hosting platforms

## Tech Stack

- **Frontend**: React 18, Vite
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Charts**: Recharts
- **Routing**: React Router
- **Stock Data**: Finnhub API

## Prerequisites

- Node.js 16+ and npm
- Free Supabase account
- Free Finnhub API key

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

### 3. Configure Stock API

1. Get a free Finnhub API key from [https://finnhub.io/](https://finnhub.io/)
2. Update the API key in `src/services/stockApi.js`:
   ```javascript
   const FINNHUB_API_KEY = 'your_actual_api_key';
   ```

**Finnhub Free Tier:** 60 calls/minute (86,400/day) - No rate limiting issues!

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

## Features in Detail

### Authentication
- Custom username/password system (no email required)
- Secure session management via Supabase
- Protected routes for authenticated users

### Stock Data
- Real-time price updates (via Finnhub API)
- Historical data for charts
- Support for multiple timeframes (daily, weekly, monthly)
- 86,400 API calls/day on free tier - no rate limiting!

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
- Finnhub has generous free tier (86,400 calls/day)
- If you see rate limiting, get a free API key from finnhub.io
- The app includes mock data as fallback

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
