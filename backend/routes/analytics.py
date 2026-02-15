"""
Analytics API Routes

These endpoints provide aggregated analytics data:
- Performance over time
- Best performing pairs
- Strategy comparison
- Personal progress tracking

All routes are prefixed with /api/analytics (set in app.py)
"""

from flask import Blueprint, request, jsonify
from backend.utils.database import execute_query

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.route("/performance", methods=["GET"])
def performance_over_time():
    """
    GET /api/analytics/performance
    Returns backtest results over time for charting progress.

    This shows how backtest returns have trended over time,
    helping users see if they're improving at strategy selection.

    Query params:
        limit: Max results (default 50)

    Example response:
        [
            {"date": "2024-01-15", "total_return": 12.5, "strategy": "SMA Crossover", ...},
            {"date": "2024-01-20", "total_return": -3.2, "strategy": "RSI", ...}
        ]
    """
    limit = request.args.get("limit", 50, type=int)

    results = execute_query(
        """
        SELECT
            br.created_at,
            a.symbol,
            br.strategy_name,
            br.total_return,
            br.sharpe_ratio,
            br.win_rate
        FROM backtest_results br
        JOIN assets a ON a.id = br.asset_id
        ORDER BY br.created_at ASC
        LIMIT %s
        """,
        (limit,)
    )

    data = []
    for row in results:
        data.append({
            "date": str(row["created_at"]),
            "symbol": row["symbol"],
            "strategy": row["strategy_name"],
            "total_return": float(row["total_return"]) if row["total_return"] else 0,
            "sharpe_ratio": float(row["sharpe_ratio"]) if row["sharpe_ratio"] else 0,
            "win_rate": float(row["win_rate"]) if row["win_rate"] else 0,
        })

    return jsonify(data)


@analytics_bp.route("/best-pairs", methods=["GET"])
def best_performing_pairs():
    """
    GET /api/analytics/best-pairs
    Returns the best performing asset/strategy combinations.

    Ranks assets by their average return across all backtests,
    so users can see which pairs work best with which strategies.

    Example response:
        [
            {"symbol": "AAPL", "avg_return": 15.3, "best_strategy": "SMA Crossover", ...},
            {"symbol": "BTC-USD", "avg_return": 8.7, "best_strategy": "MACD", ...}
        ]
    """
    results = execute_query(
        """
        SELECT
            a.symbol,
            a.name,
            a.asset_type,
            COUNT(br.id) as total_backtests,
            ROUND(AVG(br.total_return)::numeric, 2) as avg_return,
            ROUND(MAX(br.total_return)::numeric, 2) as best_return,
            ROUND(AVG(br.sharpe_ratio)::numeric, 2) as avg_sharpe
        FROM backtest_results br
        JOIN assets a ON a.id = br.asset_id
        GROUP BY a.id, a.symbol, a.name, a.asset_type
        ORDER BY avg_return DESC
        """
    )

    # For each asset, also find which strategy worked best
    data = []
    for row in results:
        # Find the best strategy for this asset
        best_strategy = execute_query(
            """
            SELECT br.strategy_name, ROUND(AVG(br.total_return)::numeric, 2) as avg_return
            FROM backtest_results br
            JOIN assets a ON a.id = br.asset_id
            WHERE a.symbol = %s
            GROUP BY br.strategy_name
            ORDER BY avg_return DESC
            LIMIT 1
            """,
            (row["symbol"],)
        )

        data.append({
            "symbol": row["symbol"],
            "name": row["name"],
            "asset_type": row["asset_type"],
            "total_backtests": row["total_backtests"],
            "avg_return": float(row["avg_return"]) if row["avg_return"] else 0,
            "best_return": float(row["best_return"]) if row["best_return"] else 0,
            "avg_sharpe": float(row["avg_sharpe"]) if row["avg_sharpe"] else 0,
            "best_strategy": best_strategy[0]["strategy_name"] if best_strategy else None,
        })

    return jsonify(data)


@analytics_bp.route("/strategy-comparison", methods=["GET"])
def strategy_comparison():
    """
    GET /api/analytics/strategy-comparison
    Compare how different strategies perform across all assets.

    This helps users identify which strategies are consistently
    profitable vs. which ones are hit-or-miss.

    Example response:
        [
            {
                "strategy": "sma_crossover",
                "total_backtests": 25,
                "avg_return": 8.5,
                "avg_win_rate": 55.2,
                ...
            }
        ]
    """
    results = execute_query(
        """
        SELECT
            strategy_name,
            COUNT(*) as total_backtests,
            ROUND(AVG(total_return)::numeric, 2) as avg_return,
            ROUND(AVG(win_rate)::numeric, 2) as avg_win_rate,
            ROUND(AVG(max_drawdown)::numeric, 2) as avg_max_drawdown,
            ROUND(AVG(sharpe_ratio)::numeric, 2) as avg_sharpe,
            ROUND(MAX(total_return)::numeric, 2) as best_return,
            ROUND(MIN(total_return)::numeric, 2) as worst_return
        FROM backtest_results
        GROUP BY strategy_name
        ORDER BY avg_return DESC
        """
    )

    data = []
    for row in results:
        data.append({
            "strategy": row["strategy_name"],
            "total_backtests": row["total_backtests"],
            "avg_return": float(row["avg_return"]) if row["avg_return"] else 0,
            "avg_win_rate": float(row["avg_win_rate"]) if row["avg_win_rate"] else 0,
            "avg_max_drawdown": float(row["avg_max_drawdown"]) if row["avg_max_drawdown"] else 0,
            "avg_sharpe": float(row["avg_sharpe"]) if row["avg_sharpe"] else 0,
            "best_return": float(row["best_return"]) if row["best_return"] else 0,
            "worst_return": float(row["worst_return"]) if row["worst_return"] else 0,
        })

    return jsonify(data)


@analytics_bp.route("/summary", methods=["GET"])
def analytics_summary():
    """
    GET /api/analytics/summary
    Returns a high-level summary of all backtesting activity.

    Used on the analytics dashboard to show key stats at a glance.
    """
    result = execute_query(
        """
        SELECT
            COUNT(*) as total_backtests,
            COUNT(DISTINCT asset_id) as assets_tested,
            COUNT(DISTINCT strategy_name) as strategies_used,
            ROUND(AVG(total_return)::numeric, 2) as avg_return,
            ROUND(MAX(total_return)::numeric, 2) as best_return,
            ROUND(MIN(total_return)::numeric, 2) as worst_return,
            ROUND(AVG(win_rate)::numeric, 2) as avg_win_rate,
            SUM(total_trades) as total_trades_executed
        FROM backtest_results
        """
    )

    row = result[0] if result else {}

    return jsonify({
        "total_backtests": row.get("total_backtests", 0),
        "assets_tested": row.get("assets_tested", 0),
        "strategies_used": row.get("strategies_used", 0),
        "avg_return": float(row["avg_return"]) if row.get("avg_return") else 0,
        "best_return": float(row["best_return"]) if row.get("best_return") else 0,
        "worst_return": float(row["worst_return"]) if row.get("worst_return") else 0,
        "avg_win_rate": float(row["avg_win_rate"]) if row.get("avg_win_rate") else 0,
        "total_trades_executed": row.get("total_trades_executed", 0),
    })
