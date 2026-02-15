"""
Data Fetching Service - Downloads Historical Price Data

This service uses the yfinance library to download historical
OHLCV (Open, High, Low, Close, Volume) data from Yahoo Finance
and stores it in our PostgreSQL database.

Supports:
  - Stocks (AAPL, MSFT, etc.)
  - Crypto (BTC-USD, ETH-USD, etc.)
  - Forex  (EURUSD=X, GBPUSD=X, etc.)
"""

import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
from backend.utils.database import execute_query, execute_many


def fetch_and_store_data(symbol, start_date=None, end_date=None):
    """
    Download historical data for a symbol and save it to the database.

    This is the main function you'll call. It:
    1. Looks up the asset in our database
    2. Downloads price data from Yahoo Finance
    3. Saves each day's OHLCV data to our price_data table

    Args:
        symbol:     Ticker symbol (e.g., "AAPL", "BTC-USD")
        start_date: Start date string "YYYY-MM-DD" (default: 10 years ago)
        end_date:   End date string "YYYY-MM-DD" (default: today)

    Returns:
        dict with "rows_added" count and "symbol"

    Example:
        result = fetch_and_store_data("AAPL")
        print(f"Added {result['rows_added']} days of data for AAPL")
    """
    # Default to 10 years of data if no dates specified
    if not start_date:
        start_date = (datetime.now() - timedelta(days=365 * 10)).strftime("%Y-%m-%d")
    if not end_date:
        end_date = datetime.now().strftime("%Y-%m-%d")

    # Step 1: Find this asset in our database
    asset = execute_query(
        "SELECT id FROM assets WHERE symbol = %s",
        (symbol,)
    )

    if not asset:
        raise ValueError(
            f"Symbol '{symbol}' not found in database. "
            f"Add it to the assets table first."
        )

    asset_id = asset[0]["id"]

    # Step 2: Download data from Yahoo Finance
    print(f"Downloading data for {symbol} from {start_date} to {end_date}...")
    ticker = yf.Ticker(symbol)
    df = ticker.history(start=start_date, end=end_date)

    if df.empty:
        raise ValueError(f"No data found for symbol '{symbol}'. Check the ticker symbol.")

    # Step 3: Prepare data for bulk insert
    # We convert each row of the DataFrame into a tuple
    rows_to_insert = []
    for date, row in df.iterrows():
        rows_to_insert.append((
            asset_id,
            date.strftime("%Y-%m-%d"),  # Convert timestamp to date string
            float(row["Open"]),
            float(row["High"]),
            float(row["Low"]),
            float(row["Close"]),
            int(row["Volume"]) if pd.notna(row["Volume"]) else 0,
        ))

    # Step 4: Bulk insert into database
    # ON CONFLICT DO UPDATE means if we already have data for that day,
    # we'll update it instead of creating a duplicate
    insert_query = """
        INSERT INTO price_data (asset_id, date, open_price, high_price,
                                low_price, close_price, volume)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (asset_id, date)
        DO UPDATE SET
            open_price = EXCLUDED.open_price,
            high_price = EXCLUDED.high_price,
            low_price = EXCLUDED.low_price,
            close_price = EXCLUDED.close_price,
            volume = EXCLUDED.volume
    """

    execute_many(insert_query, rows_to_insert)

    print(f"Successfully stored {len(rows_to_insert)} rows for {symbol}")
    return {
        "symbol": symbol,
        "rows_added": len(rows_to_insert),
        "start_date": start_date,
        "end_date": end_date,
    }


def get_price_data(symbol, start_date=None, end_date=None):
    """
    Retrieve stored price data from our database.

    This is what we use when running backtests - we read from
    our local database instead of downloading from Yahoo each time.

    Args:
        symbol:     Ticker symbol
        start_date: Optional start date filter "YYYY-MM-DD"
        end_date:   Optional end date filter "YYYY-MM-DD"

    Returns:
        pandas DataFrame with columns: date, open, high, low, close, volume
    """
    # Build the query dynamically based on which filters are provided
    query = """
        SELECT pd.date, pd.open_price, pd.high_price,
               pd.low_price, pd.close_price, pd.volume
        FROM price_data pd
        JOIN assets a ON a.id = pd.asset_id
        WHERE a.symbol = %s
    """
    params = [symbol]

    if start_date:
        query += " AND pd.date >= %s"
        params.append(start_date)

    if end_date:
        query += " AND pd.date <= %s"
        params.append(end_date)

    query += " ORDER BY pd.date ASC"

    rows = execute_query(query, tuple(params))

    if not rows:
        return pd.DataFrame()

    # Convert database rows to a pandas DataFrame
    df = pd.DataFrame(rows)

    # Rename columns to shorter, standard names
    df.columns = ["date", "open", "high", "low", "close", "volume"]

    return df


def fetch_all_assets():
    """
    Download data for ALL assets in the database.

    Useful for initial setup - call this once to populate
    your database with historical data for every asset.

    Returns:
        List of results (one per asset)
    """
    assets = execute_query("SELECT symbol FROM assets ORDER BY asset_type, symbol")
    results = []

    for asset in assets:
        try:
            result = fetch_and_store_data(asset["symbol"])
            results.append(result)
        except Exception as e:
            print(f"Error fetching {asset['symbol']}: {e}")
            results.append({"symbol": asset["symbol"], "error": str(e)})

    return results
