/**
 * AnalyticsPage - Performance Analytics Dashboard
 *
 * Shows aggregated data across all backtests:
 *   1. Summary stats (total backtests, avg return, etc.)
 *   2. Performance over time chart
 *   3. Strategy comparison chart
 *   4. Best performing pairs table
 *
 * All data comes from the /api/analytics endpoints.
 */

import React, { useState, useEffect } from "react";
import MetricCard from "../components/shared/MetricCard";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import ErrorMessage from "../components/shared/ErrorMessage";
import PerformanceChart from "../components/analytics/PerformanceChart";
import StrategyComparisonChart from "../components/analytics/StrategyComparisonChart";
import BestPairsTable from "../components/analytics/BestPairsTable";
import {
  getAnalyticsSummary,
  getPerformanceHistory,
  getStrategyComparison,
  getBestPairs,
} from "../services/api";

function AnalyticsPage() {
  // State for all analytics data
  const [summary, setSummary] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [strategyComparison, setStrategyComparison] = useState([]);
  const [bestPairs, setBestPairs] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all analytics data when the page mounts
  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        setError(null);

        // Fetch all analytics data in parallel
        const [summaryData, perfData, compData, pairsData] =
          await Promise.all([
            getAnalyticsSummary(),
            getPerformanceHistory(),
            getStrategyComparison(),
            getBestPairs(),
          ]);

        setSummary(summaryData);
        setPerformance(perfData);
        setStrategyComparison(compData);
        setBestPairs(pairsData);
      } catch (err) {
        setError(
          "Failed to load analytics. Is the backend server running?"
        );
        console.error("Analytics load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading analytics..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Analytics Dashboard
        </h1>
        <p className="text-gray-500 mt-1">
          Track your backtesting progress and find the best strategies.
        </p>
      </div>

      {/* Summary Stats Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Total Backtests"
            value={summary.total_backtests}
            subtitle={`${summary.assets_tested} assets tested`}
          />
          <MetricCard
            title="Avg Return"
            value={`${summary.avg_return >= 0 ? "+" : ""}${summary.avg_return}%`}
            subtitle={`Best: ${summary.best_return >= 0 ? "+" : ""}${summary.best_return}%`}
            color={summary.avg_return >= 0 ? "green" : "red"}
          />
          <MetricCard
            title="Avg Win Rate"
            value={`${summary.avg_win_rate}%`}
            subtitle={`${summary.strategies_used} strategies used`}
            color={summary.avg_win_rate >= 50 ? "green" : "default"}
          />
          <MetricCard
            title="Total Trades"
            value={summary.total_trades_executed?.toLocaleString()}
            subtitle="Across all backtests"
          />
        </div>
      )}

      {/* Performance Over Time Chart */}
      <PerformanceChart data={performance} />

      {/* Strategy Comparison Chart */}
      <StrategyComparisonChart data={strategyComparison} />

      {/* Best Performing Pairs Table */}
      <BestPairsTable data={bestPairs} />
    </div>
  );
}

export default AnalyticsPage;
