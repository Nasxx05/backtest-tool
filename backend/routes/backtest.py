"""
Backtest API Routes

These endpoints handle running backtests and retrieving results:
- List available strategies
- Run a new backtest
- Get past backtest results

All routes are prefixed with /api/backtest (set in app.py)
"""

from flask import Blueprint, request, jsonify
from backend.services.backtester import run_backtest, STRATEGIES
from backend.utils.database import execute_query

# Create the backtest routes blueprint
backtest_bp = Blueprint("backtest", __name__)


@backtest_bp.route("/strategies", methods=["GET"])
def list_strategies():
    """
    GET /api/backtest/strategies
    Returns all available trading strategies and their parameters.

    The frontend uses this to build the strategy selection UI
    and show parameter inputs with correct min/max/default values.

    Example response:
        {
            "sma_crossover": {
                "name": "SMA Crossover",
                "description": "Buy when short MA crosses above long MA",
                "params": {
                    "short_period": {"type": "int", "default": 20, ...},
                    "long_period": {"type": "int", "default": 50, ...}
                }
            }
        }
    """
    # Build response without the "function" key (can't serialize functions)
    strategies = {}
    for key, info in STRATEGIES.items():
        strategies[key] = {
            "name": info["name"],
            "description": info["description"],
            "params": info["params"],
        }

    return jsonify(strategies)


@backtest_bp.route("/run", methods=["POST"])
def execute_backtest():
    """
    POST /api/backtest/run
    Run a new backtest with the specified parameters.

    JSON body:
        symbol:          Ticker symbol (required, e.g., "AAPL")
        strategy:        Strategy key (required, e.g., "sma_crossover")
        params:          Strategy parameters dict (optional, uses defaults)
        start_date:      Start date "YYYY-MM-DD" (optional)
        end_date:        End date "YYYY-MM-DD" (optional)
        initial_capital: Starting capital (optional, default 10000)

    Example request:
        POST /api/backtest/run
        {
            "symbol": "AAPL",
            "strategy": "sma_crossover",
            "params": {"short_period": 20, "long_period": 50},
            "start_date": "2020-01-01",
            "end_date": "2024-01-01",
            "initial_capital": 10000
        }
    """
    try:
        body = request.get_json()

        # Validate required fields
        if not body:
            return jsonify({"error": "Request body is required"}), 400

        symbol = body.get("symbol")
        strategy = body.get("strategy")

        if not symbol:
            return jsonify({"error": "symbol is required"}), 400
        if not strategy:
            return jsonify({"error": "strategy is required"}), 400

        # Run the backtest
        result = run_backtest(
            symbol=symbol,
            strategy_name=strategy,
            params=body.get("params"),
            start_date=body.get("start_date"),
            end_date=body.get("end_date"),
            initial_capital=body.get("initial_capital", 10000),
        )

        return jsonify(result)

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Backtest failed: {str(e)}"}), 500


@backtest_bp.route("/history", methods=["GET"])
def get_backtest_history():
    """
    GET /api/backtest/history
    Returns a list of past backtest results.

    Query params:
        limit: Max results to return (default 20)

    Example:
        GET /api/backtest/history?limit=10
    """
    limit = request.args.get("limit", 20, type=int)

    results = execute_query(
        """
        SELECT
            br.id,
            a.symbol,
            a.name as asset_name,
            br.strategy_name,
            br.strategy_params,
            br.start_date,
            br.end_date,
            br.total_return,
            br.win_rate,
            br.max_drawdown,
            br.sharpe_ratio,
            br.total_trades,
            br.created_at
        FROM backtest_results br
        JOIN assets a ON a.id = br.asset_id
        ORDER BY br.created_at DESC
        LIMIT %s
        """,
        (limit,)
    )

    # Convert dates and decimals to JSON-friendly formats
    formatted = []
    for row in results:
        formatted.append({
            "id": row["id"],
            "symbol": row["symbol"],
            "asset_name": row["asset_name"],
            "strategy_name": row["strategy_name"],
            "strategy_params": row["strategy_params"],
            "start_date": str(row["start_date"]),
            "end_date": str(row["end_date"]),
            "total_return": float(row["total_return"]) if row["total_return"] else 0,
            "win_rate": float(row["win_rate"]) if row["win_rate"] else 0,
            "max_drawdown": float(row["max_drawdown"]) if row["max_drawdown"] else 0,
            "sharpe_ratio": float(row["sharpe_ratio"]) if row["sharpe_ratio"] else 0,
            "total_trades": row["total_trades"],
            "created_at": str(row["created_at"]),
        })

    return jsonify(formatted)


@backtest_bp.route("/<int:backtest_id>", methods=["GET"])
def get_backtest_detail(backtest_id):
    """
    GET /api/backtest/<id>
    Returns detailed results for a specific backtest, including trades.

    URL params:
        backtest_id: The ID of the backtest to retrieve
    """
    # Get the backtest result
    result = execute_query(
        """
        SELECT
            br.id, a.symbol, a.name as asset_name,
            br.strategy_name, br.strategy_params,
            br.start_date, br.end_date,
            br.total_return, br.win_rate, br.max_drawdown,
            br.sharpe_ratio, br.total_trades, br.created_at
        FROM backtest_results br
        JOIN assets a ON a.id = br.asset_id
        WHERE br.id = %s
        """,
        (backtest_id,)
    )

    if not result:
        return jsonify({"error": "Backtest not found"}), 404

    backtest = result[0]

    # Get the trades for this backtest
    trades = execute_query(
        """
        SELECT trade_type, entry_date, entry_price, exit_date,
               exit_price, profit_loss, profit_loss_pct
        FROM trades
        WHERE backtest_id = %s
        ORDER BY entry_date
        """,
        (backtest_id,)
    )

    return jsonify({
        "id": backtest["id"],
        "symbol": backtest["symbol"],
        "asset_name": backtest["asset_name"],
        "strategy_name": backtest["strategy_name"],
        "strategy_params": backtest["strategy_params"],
        "start_date": str(backtest["start_date"]),
        "end_date": str(backtest["end_date"]),
        "metrics": {
            "total_return": float(backtest["total_return"]) if backtest["total_return"] else 0,
            "win_rate": float(backtest["win_rate"]) if backtest["win_rate"] else 0,
            "max_drawdown": float(backtest["max_drawdown"]) if backtest["max_drawdown"] else 0,
            "sharpe_ratio": float(backtest["sharpe_ratio"]) if backtest["sharpe_ratio"] else 0,
            "total_trades": backtest["total_trades"],
        },
        "trades": [
            {
                "type": t["trade_type"],
                "entry_date": str(t["entry_date"]),
                "entry_price": float(t["entry_price"]),
                "exit_date": str(t["exit_date"]) if t["exit_date"] else None,
                "exit_price": float(t["exit_price"]) if t["exit_price"] else None,
                "profit_loss": float(t["profit_loss"]) if t["profit_loss"] else None,
                "profit_loss_pct": float(t["profit_loss_pct"]) if t["profit_loss_pct"] else None,
            }
            for t in trades
        ],
    })
