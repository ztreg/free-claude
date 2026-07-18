# Supabase Setup Guide

Follow these steps to set up your free Supabase project for authentication and database.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up/login (free)
4. Create a new project:
   - Name: `tompastocks` (or your preferred name)
   - Database password: (generate a strong password)
   - Region: Choose closest to your users
5. Wait for project to be created (2-3 minutes)

## 2. Get API Credentials

1. Go to Project Settings → API
2. Copy these values:
   - Project URL
   - anon/public key

## 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```
   VITE_SUPABASE_URL=your_actual_project_url
   VITE_SUPABASE_ANON_KEY=your_actual_anon_key
   ```

## 4. Configure Authentication

1. Go to Authentication → Settings
2. Ensure "Email auth" is enabled
3. Disable "Confirm email" (since we're using username/password without email)
4. Set "Site URL" to your app URL (e.g., `http://localhost:3000` for dev, `https://tompastocks.netlify.app` for production)

## 5. Create Database Tables

Go to SQL Editor and run this script:

```sql
-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create watchlist table
CREATE TABLE watchlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  ticker TEXT NOT NULL,
  company_name TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, ticker)
);

-- Create stock_prices table for caching
CREATE TABLE stock_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker TEXT NOT NULL,
  date DATE NOT NULL,
  open_price DECIMAL(10, 4),
  high_price DECIMAL(10, 4),
  low_price DECIMAL(10, 4),
  close_price DECIMAL(10, 4),
  volume BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(ticker, date)
);

-- Create indexes for better performance
CREATE INDEX idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX idx_stock_prices_ticker ON stock_prices(ticker);
CREATE INDEX idx_stock_prices_date ON stock_prices(date);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_prices ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own watchlist" ON watchlist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own watchlist" ON watchlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from own watchlist" ON watchlist
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view stock prices" ON stock_prices
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert stock prices" ON stock_prices
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 6. Important Notes

- The app uses custom username authentication by converting username to email format (username@tompastocks.local)
- Never commit your `.env` file to version control
- Keep your anon key safe - it's meant for client-side use but should still be protected
- The app uses Finnhub API for stock data (get free key at https://finnhub.io/)

## 7. Configure Stock API

1. Get a free Finnhub API key from https://finnhub.io/ (sign up for free)
2. Update the API key in `src/services/stockApi.js`:
   ```javascript
   const FINNHUB_API_KEY = 'your_actual_api_key';
   ```

**Finnhub Free Tier Benefits:**
- 60 calls/minute (86,400/day) - No rate limiting issues
- Real-time stock quotes
- Historical data for charts
- Stock search functionality
- Completely free for personal use

## 8. Test Your Setup

Once configured, your app should be able to:
- Sign up new users with custom username/password
- Log in existing users
- Search for stocks
- Add stocks to watchlist
- View stock prices and changes
- Display interactive charts
- Store and retrieve watchlist data
