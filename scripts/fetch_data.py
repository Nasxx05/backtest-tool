"""
Data Fetching Script

Run this script to download historical price data from Yahoo Finance
for all assets in the database. This populates the price_data table
so you can run backtests.

Usage:
    # From the project root directory:
    python -m scripts.fetch_data

    # Or fetch a single symbol:
    python -m scripts.fetch_data AAPL

    # Or fetch with a custom date range:
    python -m scripts.fetch_data AAPL 2010-01-01 2024-01-01
"""

import sys
import os

# Add the project root to Python's path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.utils.database import init_database
from backend.services.data_fetcher import fetch_and_store_data, fetch_all_assets


def main():
    """Main entry point for the data fetching script."""
    print("=" * 60)
    print("  Backtest Tool - Data Fetcher")
    print("=" * 60)

    # Step 1: Make sure the database tables exist
    print("\nInitializing database tables...")
    try:
        init_database()
    except Exception as e:
        print(f"\nError: Could not connect to the database!")
        print(f"Details: {e}")
        print(f"\nMake sure:")
        print(f"  1. PostgreSQL is running")
        print(f"  2. Your .env file has the correct database settings")
        print(f"  3. The database '{os.getenv('DATABASE_NAME', 'backtest_tool')}' exists")
        print(f"\nCreate the database with:")
        print(f"  createdb backtest_tool")
        return

    # Step 2: Fetch data based on command-line arguments
    if len(sys.argv) > 1:
        # Fetch a specific symbol
        symbol = sys.argv[1].upper()
        start_date = sys.argv[2] if len(sys.argv) > 2 else None
        end_date = sys.argv[3] if len(sys.argv) > 3 else None

        print(f"\nFetching data for {symbol}...")
        try:
            result = fetch_and_store_data(symbol, start_date, end_date)
            print(f"Done! Added {result['rows_added']} data points.")
        except Exception as e:
            print(f"Error: {e}")
    else:
        # Fetch all assets
        print("\nFetching data for ALL assets...")
        print("This may take a few minutes depending on your connection.\n")

        results = fetch_all_assets()

        print("\n" + "=" * 60)
        print("  Results Summary")
        print("=" * 60)

        for result in results:
            if "error" in result:
                print(f"  {result['symbol']:12s} ERROR: {result['error']}")
            else:
                print(f"  {result['symbol']:12s} {result['rows_added']:6d} rows")

        print("=" * 60)
        print("Done! Your database is ready for backtesting.")


if __name__ == "__main__":
    main()
