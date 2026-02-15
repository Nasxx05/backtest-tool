"""
Backtesting Engine - The Heart of Our Application

This module runs trading strategies against historical price data
to see how they would have performed. It calculates key metrics
like total return, win rate, max drawdown, and Sharpe ratio.

HOW BACKTESTING WORKS:
1. Load historical price data for an asset
2. Walk through each day chronologically
3. Check if the strategy says "BUY" or "SELL"
4. Record each trade and calculate profit/loss
5. Compute overall performance metrics

AVAILABLE STRATEGIES:
- SMA Crossover: Buy when short moving average crosses above long one
- RSI: Buy when RSI is oversold, sell when overbought
- Bollinger Bands: Buy at lower band, sell at upper band
- MACD: Buy/sell based on MACD line crossing signal line
"""

import numpy as np
import pandas as pd
from backend.services.data_fetcher import get_price_data
from backend.utils.database import execute_query


# =============================================================
# TECHNICAL INDICATOR CALCULATIONS
# =============================================================
# These functions calculate the math behind common trading indicators.
# Each one takes a price Series and returns a new Series of values.

def calculate_sma(prices, period):
    """
    Simple Moving Average (SMA).

    The average closing price over the last N days.
    Example: SMA(20) = average of last 20 closing prices.

    Args:
        prices: pandas Series of prices
        period: Number of days to average over

    Returns:
        pandas Series with the moving average values
    """
    return prices.rolling(window=period).mean()


def calculate_ema(prices, period):
    """
    Exponential Moving Average (EMA).

    Like SMA, but gives more weight to recent prices.
    This makes it react faster to price changes.

    Args:
        prices: pandas Series of prices
        period: Number of days for the EMA window

    Returns:
        pandas Series with EMA values
    """
    return prices.ewm(span=period, adjust=False).mean()


def calculate_rsi(prices, period=14):
    """
    Relative Strength Index (RSI).

    Measures whether an asset is "overbought" or "oversold".
    - RSI > 70 = overbought (price might go down)
    - RSI < 30 = oversold (price might go up)
    Range: 0 to 100

    Args:
        prices: pandas Series of closing prices
        period: Lookback period (default 14 days)

    Returns:
        pandas Series with RSI values (0-100)
    """
    # Calculate daily price changes
    delta = prices.diff()

    # Separate gains (positive changes) and losses (negative changes)
    gain = delta.where(delta > 0, 0.0)
    loss = (-delta).where(delta < 0, 0.0)

    # Average gain and loss over the period
    avg_gain = gain.rolling(window=period).mean()
    avg_loss = loss.rolling(window=period).mean()

    # Relative Strength = average gain / average loss
    rs = avg_gain / avg_loss

    # RSI formula: 100 - (100 / (1 + RS))
    rsi = 100 - (100 / (1 + rs))

    return rsi


def calculate_bollinger_bands(prices, period=20, num_std=2):
    """
    Bollinger Bands.

    Three lines that show if a price is relatively high or low:
    - Middle band = SMA
    - Upper band  = SMA + (2 * standard deviation)
    - Lower band  = SMA - (2 * standard deviation)

    When price touches the lower band, it might bounce up.
    When price touches the upper band, it might pull back.

    Args:
        prices:  pandas Series of closing prices
        period:  Lookback period for SMA (default 20)
        num_std: Number of standard deviations (default 2)

    Returns:
        Tuple of (middle_band, upper_band, lower_band) Series
    """
    middle = prices.rolling(window=period).mean()
    std = prices.rolling(window=period).std()
    upper = middle + (std * num_std)
    lower = middle - (std * num_std)
    return middle, upper, lower


def calculate_macd(prices, fast=12, slow=26, signal=9):
    """
    MACD (Moving Average Convergence Divergence).

    Shows the relationship between two moving averages:
    - MACD line = Fast EMA - Slow EMA
    - Signal line = EMA of the MACD line
    - When MACD crosses above signal = bullish (buy)
    - When MACD crosses below signal = bearish (sell)

    Args:
        prices: pandas Series of closing prices
        fast:   Fast EMA period (default 12)
        slow:   Slow EMA period (default 26)
        signal: Signal line EMA period (default 9)

    Returns:
        Tuple of (macd_line, signal_line) Series
    """
    fast_ema = calculate_ema(prices, fast)
    slow_ema = calculate_ema(prices, slow)
    macd_line = fast_ema - slow_ema
    signal_line = calculate_ema(macd_line, signal)
    return macd_line, signal_line


# =============================================================
# STRATEGY FUNCTIONS
# =============================================================
# Each strategy function takes a DataFrame of price data and
# strategy parameters, then returns a Series of signals:
#   1  = BUY signal
#  -1  = SELL signal
#   0  = No signal (hold current position)

def strategy_sma_crossover(df, params):
    """
    SMA Crossover Strategy.

    BUY when the short-term SMA crosses ABOVE the long-term SMA.
    SELL when the short-term SMA crosses BELOW the long-term SMA.

    The idea: when the short average rises above the long average,
    it suggests upward momentum (and vice versa).

    Params:
        short_period: Days for the fast moving average (default 20)
        long_period:  Days for the slow moving average (default 50)
    """
    short_period = params.get("short_period", 20)
    long_period = params.get("long_period", 50)

    # Calculate both moving averages
    short_sma = calculate_sma(df["close"], short_period)
    long_sma = calculate_sma(df["close"], long_period)

    # Generate signals
    signals = pd.Series(0, index=df.index)

    # Buy when short SMA crosses above long SMA
    # Sell when short SMA crosses below long SMA
    for i in range(1, len(df)):
        if short_sma.iloc[i] > long_sma.iloc[i] and short_sma.iloc[i - 1] <= long_sma.iloc[i - 1]:
            signals.iloc[i] = 1   # BUY
        elif short_sma.iloc[i] < long_sma.iloc[i] and short_sma.iloc[i - 1] >= long_sma.iloc[i - 1]:
            signals.iloc[i] = -1  # SELL

    # Store indicator values for charting
    df["short_sma"] = short_sma
    df["long_sma"] = long_sma

    return signals


def strategy_rsi(df, params):
    """
    RSI (Relative Strength Index) Strategy.

    BUY when RSI drops below the oversold level (default 30).
    SELL when RSI rises above the overbought level (default 70).

    The idea: extreme RSI values suggest the price has moved too
    far and might reverse direction.

    Params:
        period:     RSI calculation period (default 14)
        oversold:   Buy threshold (default 30)
        overbought: Sell threshold (default 70)
    """
    period = params.get("period", 14)
    oversold = params.get("oversold", 30)
    overbought = params.get("overbought", 70)

    rsi = calculate_rsi(df["close"], period)
    signals = pd.Series(0, index=df.index)

    for i in range(1, len(df)):
        if rsi.iloc[i] < oversold and rsi.iloc[i - 1] >= oversold:
            signals.iloc[i] = 1   # BUY - RSI dropped into oversold
        elif rsi.iloc[i] > overbought and rsi.iloc[i - 1] <= overbought:
            signals.iloc[i] = -1  # SELL - RSI rose into overbought

    df["rsi"] = rsi
    return signals


def strategy_bollinger_bands(df, params):
    """
    Bollinger Bands Strategy.

    BUY when price touches or drops below the lower band.
    SELL when price touches or rises above the upper band.

    The idea: price tends to bounce between the bands,
    so buying low and selling high within the bands works
    in ranging (non-trending) markets.

    Params:
        period:  Lookback period (default 20)
        num_std: Number of standard deviations (default 2)
    """
    period = params.get("period", 20)
    num_std = params.get("num_std", 2)

    middle, upper, lower = calculate_bollinger_bands(df["close"], period, num_std)
    signals = pd.Series(0, index=df.index)

    for i in range(1, len(df)):
        if df["close"].iloc[i] <= lower.iloc[i] and df["close"].iloc[i - 1] > lower.iloc[i - 1]:
            signals.iloc[i] = 1   # BUY - price hit lower band
        elif df["close"].iloc[i] >= upper.iloc[i] and df["close"].iloc[i - 1] < upper.iloc[i - 1]:
            signals.iloc[i] = -1  # SELL - price hit upper band

    df["bb_middle"] = middle
    df["bb_upper"] = upper
    df["bb_lower"] = lower
    return signals


def strategy_macd(df, params):
    """
    MACD Crossover Strategy.

    BUY when MACD line crosses above the signal line.
    SELL when MACD line crosses below the signal line.

    The idea: MACD crossing its signal line indicates a
    shift in momentum direction.

    Params:
        fast_period:   Fast EMA period (default 12)
        slow_period:   Slow EMA period (default 26)
        signal_period: Signal line period (default 9)
    """
    fast = params.get("fast_period", 12)
    slow = params.get("slow_period", 26)
    signal = params.get("signal_period", 9)

    macd_line, signal_line = calculate_macd(df["close"], fast, slow, signal)
    signals = pd.Series(0, index=df.index)

    for i in range(1, len(df)):
        if macd_line.iloc[i] > signal_line.iloc[i] and macd_line.iloc[i - 1] <= signal_line.iloc[i - 1]:
            signals.iloc[i] = 1   # BUY
        elif macd_line.iloc[i] < signal_line.iloc[i] and macd_line.iloc[i - 1] >= signal_line.iloc[i - 1]:
            signals.iloc[i] = -1  # SELL

    df["macd_line"] = macd_line
    df["signal_line"] = signal_line
    return signals


# Map strategy names to their functions
# This makes it easy to look up a strategy by name from the API
STRATEGIES = {
    "sma_crossover": {
        "function": strategy_sma_crossover,
        "name": "SMA Crossover",
        "description": "Buy when short moving average crosses above long moving average",
        "params": {
            "short_period": {"type": "int", "default": 20, "min": 5, "max": 200, "label": "Short MA Period"},
            "long_period": {"type": "int", "default": 50, "min": 10, "max": 500, "label": "Long MA Period"},
        },
    },
    "rsi": {
        "function": strategy_rsi,
        "name": "RSI",
        "description": "Buy when RSI is oversold, sell when overbought",
        "params": {
            "period": {"type": "int", "default": 14, "min": 5, "max": 50, "label": "RSI Period"},
            "oversold": {"type": "int", "default": 30, "min": 10, "max": 50, "label": "Oversold Level"},
            "overbought": {"type": "int", "default": 70, "min": 50, "max": 95, "label": "Overbought Level"},
        },
    },
    "bollinger_bands": {
        "function": strategy_bollinger_bands,
        "name": "Bollinger Bands",
        "description": "Buy at lower band, sell at upper band",
        "params": {
            "period": {"type": "int", "default": 20, "min": 10, "max": 100, "label": "Period"},
            "num_std": {"type": "float", "default": 2, "min": 1, "max": 3, "label": "Std Deviations"},
        },
    },
    "macd": {
        "function": strategy_macd,
        "name": "MACD Crossover",
        "description": "Buy/sell based on MACD and signal line crossovers",
        "params": {
            "fast_period": {"type": "int", "default": 12, "min": 5, "max": 50, "label": "Fast EMA Period"},
            "slow_period": {"type": "int", "default": 26, "min": 10, "max": 100, "label": "Slow EMA Period"},
            "signal_period": {"type": "int", "default": 9, "min": 5, "max": 50, "label": "Signal Period"},
        },
    },
}


# =============================================================
# BACKTEST EXECUTION
# =============================================================

def run_backtest(symbol, strategy_name, params=None, start_date=None, end_date=None, initial_capital=10000):
    """
    Execute a backtest and return the results.

    This is the main function the API calls. It:
    1. Loads price data from the database
    2. Runs the chosen strategy to generate buy/sell signals
    3. Simulates trading based on those signals
    4. Calculates performance metrics
    5. Saves results to the database

    Args:
        symbol:          Ticker symbol (e.g., "AAPL")
        strategy_name:   Name of strategy (e.g., "sma_crossover")
        params:          Strategy parameters dict (uses defaults if None)
        start_date:      Backtest start date "YYYY-MM-DD"
        end_date:        Backtest end date "YYYY-MM-DD"
        initial_capital: Starting money amount (default $10,000)

    Returns:
        dict with all backtest results, trades, and chart data
    """
    # Validate the strategy name
    if strategy_name not in STRATEGIES:
        raise ValueError(
            f"Unknown strategy '{strategy_name}'. "
            f"Available: {list(STRATEGIES.keys())}"
        )

    strategy_info = STRATEGIES[strategy_name]
    strategy_func = strategy_info["function"]

    # Use default params if none provided
    if params is None:
        params = {}
    # Fill in any missing params with defaults
    for key, param_info in strategy_info["params"].items():
        if key not in params:
            params[key] = param_info["default"]

    # Step 1: Get price data
    df = get_price_data(symbol, start_date, end_date)
    if df.empty:
        raise ValueError(
            f"No price data found for '{symbol}'. "
            f"Run the data fetcher first to download historical data."
        )

    # Make a copy so the strategy function can add indicator columns
    df = df.copy()

    # Step 2: Generate buy/sell signals
    signals = strategy_func(df, params)

    # Step 3: Simulate trading
    trades, portfolio_values = simulate_trades(df, signals, initial_capital)

    # Step 4: Calculate performance metrics
    metrics = calculate_metrics(trades, portfolio_values, initial_capital)

    # Step 5: Save results to database
    backtest_id = save_backtest_results(
        symbol, strategy_name, params, df, metrics, trades
    )

    # Step 6: Prepare response data
    # Convert dates to strings for JSON serialization
    chart_data = []
    for i, row in df.iterrows():
        point = {
            "date": str(row["date"]),
            "close": float(row["close"]),
            "portfolio_value": float(portfolio_values[i]),
        }
        # Add indicator values if they exist
        for col in ["short_sma", "long_sma", "rsi", "bb_upper", "bb_lower",
                     "bb_middle", "macd_line", "signal_line"]:
            if col in df.columns and pd.notna(row[col]):
                point[col] = float(row[col])
        chart_data.append(point)

    # Format trades for the response
    trade_list = []
    for trade in trades:
        trade_list.append({
            "type": trade["type"],
            "entry_date": str(trade["entry_date"]),
            "entry_price": round(trade["entry_price"], 2),
            "exit_date": str(trade["exit_date"]) if trade["exit_date"] else None,
            "exit_price": round(trade["exit_price"], 2) if trade["exit_price"] else None,
            "profit_loss": round(trade["profit_loss"], 2) if trade["profit_loss"] else None,
            "profit_loss_pct": round(trade["profit_loss_pct"], 2) if trade["profit_loss_pct"] else None,
        })

    return {
        "backtest_id": backtest_id,
        "symbol": symbol,
        "strategy": strategy_info["name"],
        "strategy_key": strategy_name,
        "params": params,
        "metrics": metrics,
        "trades": trade_list,
        "chart_data": chart_data,
    }


def simulate_trades(df, signals, initial_capital):
    """
    Simulate executing trades based on strategy signals.

    Walks through each day and:
    - If signal = 1 (BUY) and we're not in a trade, buy
    - If signal = -1 (SELL) and we're in a trade, sell
    - Track portfolio value each day

    Args:
        df:              DataFrame with price data
        signals:         Series of signals (1=buy, -1=sell, 0=hold)
        initial_capital: Starting cash amount

    Returns:
        Tuple of (trades_list, portfolio_values_array)
    """
    cash = initial_capital
    shares = 0              # How many shares we currently hold
    in_position = False     # Are we currently in a trade?
    trades = []             # List of all completed trades
    current_trade = None    # The trade we're currently in
    portfolio_values = []   # Portfolio value at each time step

    for i in range(len(df)):
        current_price = float(df["close"].iloc[i])
        current_date = df["date"].iloc[i]

        # BUY signal - enter a new position
        if signals.iloc[i] == 1 and not in_position:
            # Spend all available cash on shares
            shares = cash / current_price
            cash = 0
            in_position = True
            current_trade = {
                "type": "BUY",
                "entry_date": current_date,
                "entry_price": current_price,
                "exit_date": None,
                "exit_price": None,
                "profit_loss": None,
                "profit_loss_pct": None,
            }

        # SELL signal - close the current position
        elif signals.iloc[i] == -1 and in_position:
            cash = shares * current_price
            profit_loss = cash - initial_capital if not trades else cash - (trades[-1].get("_cash_after", initial_capital))

            # Calculate profit/loss for this specific trade
            trade_profit = (current_price - current_trade["entry_price"]) * shares
            trade_pct = ((current_price / current_trade["entry_price"]) - 1) * 100

            current_trade["exit_date"] = current_date
            current_trade["exit_price"] = current_price
            current_trade["profit_loss"] = trade_profit
            current_trade["profit_loss_pct"] = trade_pct
            current_trade["_cash_after"] = cash

            trades.append(current_trade)
            shares = 0
            in_position = False

        # Calculate portfolio value = cash + value of shares held
        portfolio_value = cash + (shares * current_price)
        portfolio_values.append(portfolio_value)

    # If we're still in a trade at the end, close it at the last price
    if in_position and current_trade:
        last_price = float(df["close"].iloc[-1])
        last_date = df["date"].iloc[-1]
        trade_profit = (last_price - current_trade["entry_price"]) * shares
        trade_pct = ((last_price / current_trade["entry_price"]) - 1) * 100

        current_trade["exit_date"] = last_date
        current_trade["exit_price"] = last_price
        current_trade["profit_loss"] = trade_profit
        current_trade["profit_loss_pct"] = trade_pct
        trades.append(current_trade)

    return trades, np.array(portfolio_values)


def calculate_metrics(trades, portfolio_values, initial_capital):
    """
    Calculate key performance metrics for the backtest.

    These metrics help you evaluate how well a strategy performed:
    - Total Return: How much money you made/lost overall
    - Win Rate: What percentage of trades were profitable
    - Max Drawdown: The worst peak-to-trough decline
    - Sharpe Ratio: Risk-adjusted return (higher is better)

    Args:
        trades:           List of trade dicts
        portfolio_values: Array of portfolio values over time
        initial_capital:  Starting amount

    Returns:
        dict of performance metrics
    """
    final_value = portfolio_values[-1] if len(portfolio_values) > 0 else initial_capital

    # Total Return (percentage)
    total_return = ((final_value - initial_capital) / initial_capital) * 100

    # Win Rate (percentage of profitable trades)
    if trades:
        winning_trades = sum(1 for t in trades if t.get("profit_loss", 0) and t["profit_loss"] > 0)
        win_rate = (winning_trades / len(trades)) * 100
    else:
        win_rate = 0

    # Max Drawdown (worst peak-to-trough decline as a percentage)
    # This tells you the most you would have lost from a peak
    if len(portfolio_values) > 0:
        peak = portfolio_values[0]
        max_drawdown = 0
        for value in portfolio_values:
            if value > peak:
                peak = value
            drawdown = ((peak - value) / peak) * 100
            if drawdown > max_drawdown:
                max_drawdown = drawdown
    else:
        max_drawdown = 0

    # Sharpe Ratio (risk-adjusted return)
    # Higher Sharpe = better risk-adjusted performance
    # Generally: > 1 is good, > 2 is very good, > 3 is excellent
    if len(portfolio_values) > 1:
        # Calculate daily returns
        daily_returns = np.diff(portfolio_values) / portfolio_values[:-1]
        if np.std(daily_returns) > 0:
            # Annualize: multiply by sqrt(252) for ~252 trading days/year
            sharpe_ratio = (np.mean(daily_returns) / np.std(daily_returns)) * np.sqrt(252)
        else:
            sharpe_ratio = 0
    else:
        sharpe_ratio = 0

    return {
        "initial_capital": round(initial_capital, 2),
        "final_value": round(final_value, 2),
        "total_return": round(total_return, 2),
        "win_rate": round(win_rate, 2),
        "max_drawdown": round(max_drawdown, 2),
        "sharpe_ratio": round(sharpe_ratio, 2),
        "total_trades": len(trades),
    }


def save_backtest_results(symbol, strategy_name, params, df, metrics, trades):
    """
    Save backtest results and trades to the database.

    This lets users look back at their past backtests and
    compare performance across different strategies and assets.

    Returns:
        The ID of the saved backtest result
    """
    import json

    # Get the asset ID
    asset = execute_query("SELECT id FROM assets WHERE symbol = %s", (symbol,))
    if not asset:
        return None
    asset_id = asset[0]["id"]

    start_date = str(df["date"].iloc[0])
    end_date = str(df["date"].iloc[-1])

    # Insert the backtest result
    result = execute_query(
        """
        INSERT INTO backtest_results
            (asset_id, strategy_name, strategy_params, start_date, end_date,
             total_return, win_rate, max_drawdown, sharpe_ratio, total_trades)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (
            asset_id,
            strategy_name,
            json.dumps(params),
            start_date,
            end_date,
            metrics["total_return"],
            metrics["win_rate"],
            metrics["max_drawdown"],
            metrics["sharpe_ratio"],
            metrics["total_trades"],
        ),
    )

    backtest_id = result[0]["id"]

    # Insert individual trades
    if trades:
        from backend.utils.database import execute_many

        trade_rows = []
        for trade in trades:
            trade_rows.append((
                backtest_id,
                trade["type"],
                str(trade["entry_date"]),
                trade["entry_price"],
                str(trade["exit_date"]) if trade["exit_date"] else None,
                trade["exit_price"],
                trade["profit_loss"],
                trade["profit_loss_pct"],
            ))

        execute_many(
            """
            INSERT INTO trades
                (backtest_id, trade_type, entry_date, entry_price,
                 exit_date, exit_price, profit_loss, profit_loss_pct)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            trade_rows,
        )

    return backtest_id
