/**
 * ResultsPage - Backtest Results Display
 *
 * Shows the full results of a completed backtest:
 *   1. Summary header (asset, strategy, date range)
 *   2. Performance metrics cards
 *   3. Interactive price + portfolio chart
 *   4. Trade history table
 *
 * Results are loaded from sessionStorage (set by DashboardPage
 * after running a backtest).
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PriceChart from "../components/results/PriceChart";
import TradeHistory from "../components/results/TradeHistory";
import MetricsPanel from "../components/results/MetricsPanel";

function ResultsPage() {
  const navigate = useNavigate();

  // State for the backtest results
  const [result, setResult] = useState(null);

  // Load results from sessionStorage when page mounts
  useEffect(() => {
    const stored = sessionStorage.getItem("backtestResult");
    if (stored) {
      try {
        setResult(JSON.parse(stored));
      } catch (err) {
        console.error("Failed to parse backtest result:", err);
      }
    }
  }, []);

  // If no results, show a message with a link back to dashboard
  if (!result) {
    return (
      <div className="text-center py-16">
        <svg
          className="w-16 h-16 text-gray-300 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          No Results Yet
        </h2>
        <p className="text-gray-500 mb-6">
          Run a backtest from the dashboard to see results here.
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl
                     font-medium hover:bg-indigo-700 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with summary info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Backtest Results
          </h1>
          <p className="text-gray-500 mt-1">
            {result.symbol} | {result.strategy} | {result.chart_data?.[0]?.date}{" "}
            to {result.chart_data?.[result.chart_data.length - 1]?.date}
          </p>
        </div>

        {/* Back to dashboard button */}
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm
                     font-medium text-gray-700 hover:bg-gray-50
                     transition-colors"
        >
          New Backtest
        </button>
      </div>

      {/* Strategy Parameters Summary */}
      {result.params && Object.keys(result.params).length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Parameters:</span>{" "}
            {Object.entries(result.params)
              .map(([key, value]) => `${key.replace(/_/g, " ")}: ${value}`)
              .join(" | ")}
          </p>
        </div>
      )}

      {/* Performance Metrics Cards */}
      <MetricsPanel metrics={result.metrics} />

      {/* Price & Portfolio Chart */}
      <PriceChart chartData={result.chart_data} trades={result.trades} />

      {/* Trade History Table */}
      <TradeHistory trades={result.trades} />
    </div>
  );
}

export default ResultsPage;
