-- =============================================================
-- Backtest Tool - Database Schema
-- =============================================================
-- This creates all the tables we need for our backtesting app.
-- Run this file once to set up your database:
--   psql -U postgres -d backtest_tool -f schema.sql
-- =============================================================

-- ----- ASSETS TABLE -----
-- Stores information about each tradeable asset (stocks, crypto, forex)
-- Example: AAPL (Apple stock), BTC-USD (Bitcoin), EURUSD=X (Euro/Dollar)
CREATE TABLE IF NOT EXISTS assets (
    id              SERIAL PRIMARY KEY,          -- Auto-incrementing unique ID
    symbol          VARCHAR(20) NOT NULL UNIQUE,  -- Ticker symbol (e.g., "AAPL")
    name            VARCHAR(100) NOT NULL,        -- Human-readable name (e.g., "Apple Inc.")
    asset_type      VARCHAR(10) NOT NULL,         -- "stock", "crypto", or "forex"
    created_at      TIMESTAMP DEFAULT NOW()       -- When we added this asset
);

-- ----- PRICE DATA TABLE -----
-- Stores historical OHLCV data (Open, High, Low, Close, Volume)
-- This is the core data we run backtests against.
-- One row = one day of price data for one asset.
CREATE TABLE IF NOT EXISTS price_data (
    id              SERIAL PRIMARY KEY,
    asset_id        INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    date            DATE NOT NULL,                -- The trading day
    open_price      NUMERIC(18, 8) NOT NULL,      -- Opening price that day
    high_price      NUMERIC(18, 8) NOT NULL,      -- Highest price that day
    low_price       NUMERIC(18, 8) NOT NULL,      -- Lowest price that day
    close_price     NUMERIC(18, 8) NOT NULL,      -- Closing price that day
    volume          BIGINT DEFAULT 0,             -- Number of shares/units traded

    -- Prevent duplicate entries: one row per asset per day
    UNIQUE(asset_id, date)
);

-- Speed up queries that filter by asset and date range
-- (We'll be doing this constantly when running backtests)
CREATE INDEX IF NOT EXISTS idx_price_data_asset_date
    ON price_data(asset_id, date);

-- ----- BACKTEST RESULTS TABLE -----
-- Stores the results of each backtest a user runs.
-- This lets users compare past results and track progress.
CREATE TABLE IF NOT EXISTS backtest_results (
    id              SERIAL PRIMARY KEY,
    asset_id        INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    strategy_name   VARCHAR(100) NOT NULL,        -- e.g., "SMA Crossover 20/50"
    strategy_params JSONB NOT NULL DEFAULT '{}',  -- Strategy settings as JSON
    start_date      DATE NOT NULL,                -- Backtest start date
    end_date        DATE NOT NULL,                -- Backtest end date
    total_return    NUMERIC(12, 4),               -- Total % return (e.g., 25.50 = 25.5%)
    win_rate        NUMERIC(6, 4),                -- % of winning trades (e.g., 0.65 = 65%)
    max_drawdown    NUMERIC(12, 4),               -- Worst peak-to-trough decline %
    sharpe_ratio    NUMERIC(8, 4),                -- Risk-adjusted return metric
    total_trades    INTEGER DEFAULT 0,            -- How many trades were made
    created_at      TIMESTAMP DEFAULT NOW()       -- When this backtest was run
);

-- ----- TRADES TABLE -----
-- Stores individual trades from each backtest.
-- Each backtest produces many trades (buy/sell pairs).
CREATE TABLE IF NOT EXISTS trades (
    id              SERIAL PRIMARY KEY,
    backtest_id     INTEGER NOT NULL REFERENCES backtest_results(id) ON DELETE CASCADE,
    trade_type      VARCHAR(4) NOT NULL,          -- "BUY" or "SELL"
    entry_date      DATE NOT NULL,                -- When we entered the trade
    entry_price     NUMERIC(18, 8) NOT NULL,      -- Price we bought/sold at
    exit_date       DATE,                         -- When we exited (NULL if still open)
    exit_price      NUMERIC(18, 8),               -- Price we closed at
    profit_loss     NUMERIC(18, 8),               -- Dollar profit or loss on this trade
    profit_loss_pct NUMERIC(8, 4),                -- Percentage profit or loss

    -- Speed up lookups by backtest ID
    CONSTRAINT fk_backtest FOREIGN KEY (backtest_id)
        REFERENCES backtest_results(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_trades_backtest
    ON trades(backtest_id);

-- =============================================================
-- SEED DATA: Pre-populate with popular assets
-- =============================================================

-- Popular stocks
INSERT INTO assets (symbol, name, asset_type) VALUES
    ('AAPL',    'Apple Inc.',               'stock'),
    ('MSFT',    'Microsoft Corporation',    'stock'),
    ('GOOGL',   'Alphabet Inc.',            'stock'),
    ('AMZN',    'Amazon.com Inc.',          'stock'),
    ('TSLA',    'Tesla Inc.',               'stock'),
    ('NVDA',    'NVIDIA Corporation',       'stock'),
    ('META',    'Meta Platforms Inc.',       'stock'),
    ('JPM',     'JPMorgan Chase & Co.',     'stock'),
    ('V',       'Visa Inc.',                'stock'),
    ('SPY',     'S&P 500 ETF',             'stock')
ON CONFLICT (symbol) DO NOTHING;

-- Popular cryptocurrencies
INSERT INTO assets (symbol, name, asset_type) VALUES
    ('BTC-USD', 'Bitcoin',                  'crypto'),
    ('ETH-USD', 'Ethereum',                 'crypto'),
    ('SOL-USD', 'Solana',                   'crypto'),
    ('ADA-USD', 'Cardano',                  'crypto'),
    ('DOGE-USD','Dogecoin',                 'crypto')
ON CONFLICT (symbol) DO NOTHING;

-- Major forex pairs
INSERT INTO assets (symbol, name, asset_type) VALUES
    ('EURUSD=X','EUR/USD',                  'forex'),
    ('GBPUSD=X','GBP/USD',                  'forex'),
    ('USDJPY=X','USD/JPY',                  'forex'),
    ('AUDUSD=X','AUD/USD',                  'forex'),
    ('USDCAD=X','USD/CAD',                  'forex')
ON CONFLICT (symbol) DO NOTHING;
