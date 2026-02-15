"""
Assets API Routes

These endpoints handle everything related to assets (stocks, crypto, forex):
- List all available assets
- Get details for a specific asset
- Fetch/update historical price data from Yahoo Finance
- Get price data for charting

All routes are prefixed with /api/assets (set in app.py)
"""

from flask import Blueprint, request, jsonify
from backend.utils.database import execute_query
from backend.services.data_fetcher import fetch_and_store_data, get_price_data

# Create a Blueprint - a group of related routes
assets_bp = Blueprint("assets", __name__)


@assets_bp.route("/", methods=["GET"])
def list_assets():
    """
    GET /api/assets/
    Returns all available assets, optionally filtered by type.

    Query params:
        type: Filter by asset type ("stock", "crypto", "forex")

    Example:
        GET /api/assets/?type=stock
        Returns: [{"id": 1, "symbol": "AAPL", "name": "Apple Inc.", ...}, ...]
    """
    asset_type = request.args.get("type")

    if asset_type:
        assets = execute_query(
            "SELECT id, symbol, name, asset_type FROM assets WHERE asset_type = %s ORDER BY symbol",
            (asset_type,)
        )
    else:
        assets = execute_query(
            "SELECT id, symbol, name, asset_type FROM assets ORDER BY asset_type, symbol"
        )

    return jsonify(assets)


@assets_bp.route("/<symbol>/data", methods=["GET"])
def get_asset_data(symbol):
    """
    GET /api/assets/<symbol>/data
    Returns historical price data for an asset.

    URL params:
        symbol: The ticker symbol (e.g., "AAPL")

    Query params:
        start_date: Start date "YYYY-MM-DD" (optional)
        end_date:   End date "YYYY-MM-DD" (optional)

    Example:
        GET /api/assets/AAPL/data?start_date=2020-01-01&end_date=2024-01-01
    """
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    df = get_price_data(symbol, start_date, end_date)

    if df.empty:
        return jsonify({"error": f"No data found for {symbol}"}), 404

    # Convert DataFrame to list of dicts for JSON response
    data = []
    for _, row in df.iterrows():
        data.append({
            "date": str(row["date"]),
            "open": float(row["open"]),
            "high": float(row["high"]),
            "low": float(row["low"]),
            "close": float(row["close"]),
            "volume": int(row["volume"]),
        })

    return jsonify({
        "symbol": symbol,
        "count": len(data),
        "data": data,
    })


@assets_bp.route("/<symbol>/fetch", methods=["POST"])
def fetch_asset_data(symbol):
    """
    POST /api/assets/<symbol>/fetch
    Download historical data from Yahoo Finance and store it.

    URL params:
        symbol: The ticker symbol (e.g., "AAPL")

    JSON body (optional):
        start_date: Start date "YYYY-MM-DD"
        end_date:   End date "YYYY-MM-DD"

    Example:
        POST /api/assets/AAPL/fetch
        Body: {"start_date": "2014-01-01"}
    """
    try:
        body = request.get_json(silent=True) or {}
        start_date = body.get("start_date")
        end_date = body.get("end_date")

        result = fetch_and_store_data(symbol, start_date, end_date)
        return jsonify(result)

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to fetch data: {str(e)}"}), 500


@assets_bp.route("/<symbol>/status", methods=["GET"])
def get_data_status(symbol):
    """
    GET /api/assets/<symbol>/status
    Check if we have data for this asset and what date range.

    Useful for the frontend to show whether data needs to be
    downloaded before running a backtest.
    """
    result = execute_query(
        """
        SELECT
            COUNT(*) as total_rows,
            MIN(pd.date) as earliest_date,
            MAX(pd.date) as latest_date
        FROM price_data pd
        JOIN assets a ON a.id = pd.asset_id
        WHERE a.symbol = %s
        """,
        (symbol,)
    )

    row = result[0] if result else {"total_rows": 0}

    return jsonify({
        "symbol": symbol,
        "has_data": row["total_rows"] > 0,
        "total_rows": row["total_rows"],
        "earliest_date": str(row["earliest_date"]) if row.get("earliest_date") else None,
        "latest_date": str(row["latest_date"]) if row.get("latest_date") else None,
    })
