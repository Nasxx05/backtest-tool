# Backtest Tool

A web application for testing trading strategies against historical market data. Supports stocks, cryptocurrency, and forex pairs with 10+ years of data.

## What This Tool Does

- **Select assets** - Pick from popular stocks (AAPL, TSLA), crypto (BTC, ETH), or forex pairs (EUR/USD)
- **Choose strategies** - SMA Crossover, RSI, Bollinger Bands, or MACD
- **Run backtests** - See how a strategy would have performed historically
- **View results** - Interactive charts with buy/sell markers, performance metrics, trade history
- **Track progress** - Analytics dashboard comparing strategies and assets over time

## Project Structure

```
backtest-tool/
├── backend/                    # Python Flask backend
│   ├── app.py                  # Flask app entry point
│   ├── config.py               # Configuration settings
│   ├── requirements.txt        # Python dependencies
│   ├── routes/                 # API endpoint handlers
│   │   ├── assets.py           #   /api/assets/* routes
│   │   ├── backtest.py         #   /api/backtest/* routes
│   │   └── analytics.py        #   /api/analytics/* routes
│   ├── services/               # Business logic
│   │   ├── backtester.py       #   Backtesting engine + strategies
│   │   └── data_fetcher.py     #   Yahoo Finance data downloader
│   └── utils/
│       └── database.py         #   Database connection helpers
├── frontend/                   # React frontend
│   ├── package.json            # Node dependencies
│   ├── public/
│   │   └── index.html          # HTML template
│   └── src/
│       ├── App.js              # Root component + routing
│       ├── index.js            # Entry point
│       ├── services/
│       │   └── api.js          # API call functions
│       ├── pages/              # Full page components
│       │   ├── DashboardPage.jsx
│       │   ├── ResultsPage.jsx
│       │   └── AnalyticsPage.jsx
│       ├── components/         # Reusable UI components
│       │   ├── layout/         #   Navbar, Layout wrapper
│       │   ├── dashboard/      #   AssetSelector, StrategyBuilder, DatePicker
│       │   ├── results/        #   PriceChart, TradeHistory, MetricsPanel
│       │   ├── analytics/      #   PerformanceChart, StrategyComparison, BestPairs
│       │   └── shared/         #   MetricCard, LoadingSpinner, ErrorMessage
│       └── styles/
│           └── index.css       # TailwindCSS imports + global styles
├── database/
│   └── schema.sql              # PostgreSQL table definitions + seed data
├── scripts/
│   └── fetch_data.py           # Script to download historical price data
├── .env.example                # Environment variables template
└── .gitignore
```

## Prerequisites

Before you start, make sure you have these installed:

1. **Python 3.9+** - [Download Python](https://www.python.org/downloads/)
2. **Node.js 18+** - [Download Node.js](https://nodejs.org/)
3. **PostgreSQL 14+** - [Download PostgreSQL](https://www.postgresql.org/download/)

## Setup Instructions

### Step 1: Clone and Configure

```bash
# Clone the repository
git clone <your-repo-url>
cd backtest-tool

# Create your .env file from the template
cp .env.example .env

# Edit .env with your database password and settings
# (use any text editor)
```

### Step 2: Set Up the Database

```bash
# Open PostgreSQL and create the database
psql -U postgres

# Inside psql, run:
CREATE DATABASE backtest_tool;
\q

# Run the schema to create tables and seed data
psql -U postgres -d backtest_tool -f database/schema.sql
```

### Step 3: Set Up the Backend

```bash
# Create a Python virtual environment
python -m venv venv

# Activate it
# On Mac/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install Python dependencies
pip install -r backend/requirements.txt
```

### Step 4: Download Historical Data

```bash
# This downloads 10+ years of data for all assets
# It takes a few minutes on first run
python -m scripts.fetch_data

# Or download just one symbol:
python -m scripts.fetch_data AAPL
```

### Step 5: Set Up the Frontend

```bash
# Navigate to the frontend folder
cd frontend

# Install Node dependencies
npm install

# Go back to the project root
cd ..
```

### Step 6: Run the Application

You need two terminal windows:

**Terminal 1 - Backend (Flask):**
```bash
# Make sure your virtualenv is activated
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Start the Flask server
python -m backend.app
# Server starts on http://localhost:5000
```

**Terminal 2 - Frontend (React):**
```bash
cd frontend
npm start
# Opens browser to http://localhost:3000
```

## How to Use

1. **Open the Dashboard** at http://localhost:3000
2. **Select an asset** from the dropdown (e.g., AAPL)
3. **Choose a strategy** (e.g., SMA Crossover)
4. **Adjust parameters** if desired (or use the defaults)
5. **Set the date range** (default: 10 years)
6. **Click "Run Backtest"** and wait for results
7. **View the Results page** - charts, metrics, and trade history
8. **Check the Analytics page** to compare strategies over time

## Available Strategies

| Strategy | How It Works | Best For |
|----------|-------------|----------|
| **SMA Crossover** | Buy when short moving average crosses above long one | Trending markets |
| **RSI** | Buy when oversold (RSI < 30), sell when overbought (RSI > 70) | Range-bound markets |
| **Bollinger Bands** | Buy at lower band, sell at upper band | Mean-reverting markets |
| **MACD** | Buy/sell on MACD and signal line crossovers | Momentum detection |

## Key Metrics Explained

- **Total Return**: Overall percentage gain/loss from start to finish
- **Win Rate**: Percentage of trades that were profitable
- **Max Drawdown**: The worst peak-to-trough decline (lower is better)
- **Sharpe Ratio**: Risk-adjusted return. Above 1 is good, above 2 is great

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Check if server is running |
| GET | `/api/assets/` | List all assets |
| GET | `/api/assets/<symbol>/data` | Get price data |
| POST | `/api/assets/<symbol>/fetch` | Download data from Yahoo |
| GET | `/api/backtest/strategies` | List available strategies |
| POST | `/api/backtest/run` | Run a backtest |
| GET | `/api/backtest/history` | Get past results |
| GET | `/api/analytics/summary` | Overall stats |
| GET | `/api/analytics/best-pairs` | Best performing assets |
| GET | `/api/analytics/strategy-comparison` | Compare strategies |

## Extending the Code

### Adding a New Strategy

Edit `backend/services/backtester.py`:

1. Create a new strategy function following the pattern of existing ones
2. Add it to the `STRATEGIES` dictionary
3. The frontend will automatically pick it up

### Adding New Assets

Edit `database/schema.sql` and add new rows to the assets INSERT, or use the API:

```bash
# Add directly to the database
psql -U postgres -d backtest_tool -c "INSERT INTO assets (symbol, name, asset_type) VALUES ('DIS', 'Walt Disney Co.', 'stock');"

# Then download data
python -m scripts.fetch_data DIS
```

## Troubleshooting

**"Failed to load data. Is the backend server running?"**
- Make sure the Flask server is running on port 5000
- Check your `.env` file has the correct database credentials

**"No data found for symbol"**
- Run `python -m scripts.fetch_data <SYMBOL>` to download the data first

**Database connection error**
- Verify PostgreSQL is running: `pg_isready`
- Check your `.env` file database settings match your PostgreSQL setup
