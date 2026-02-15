/**
 * MetricsPanel Component
 *
 * Displays all the key performance metrics from a backtest
 * in a grid of MetricCards. This gives a quick at-a-glance
 * view of how well a strategy performed.
 *
 * Props:
 *   metrics: Object with all metric values from the backtest API
 */

import React from "react";
import MetricCard from "../shared/MetricCard";

function MetricsPanel({ metrics }) {
  if (!metrics) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Performance Metrics
      </h3>

      {/* Grid of metric cards - responsive layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Return */}
        <MetricCard
          title="Total Return"
          value={`${metrics.total_return >= 0 ? "+" : ""}${metrics.total_return}%`}
          subtitle={`$${metrics.initial_capital?.toLocaleString()} → $${metrics.final_value?.toLocaleString()}`}
          color={metrics.total_return >= 0 ? "green" : "red"}
        />

        {/* Win Rate */}
        <MetricCard
          title="Win Rate"
          value={`${metrics.win_rate}%`}
          subtitle={`${metrics.total_trades} total trades`}
          color={metrics.win_rate >= 50 ? "green" : "red"}
        />

        {/* Max Drawdown */}
        <MetricCard
          title="Max Drawdown"
          value={`-${metrics.max_drawdown}%`}
          subtitle="Worst peak-to-trough decline"
          color={metrics.max_drawdown < 20 ? "green" : "red"}
        />

        {/* Sharpe Ratio */}
        <MetricCard
          title="Sharpe Ratio"
          value={metrics.sharpe_ratio?.toFixed(2)}
          subtitle={
            metrics.sharpe_ratio > 2
              ? "Excellent"
              : metrics.sharpe_ratio > 1
              ? "Good"
              : metrics.sharpe_ratio > 0
              ? "Fair"
              : "Poor"
          }
          color={metrics.sharpe_ratio > 1 ? "green" : metrics.sharpe_ratio > 0 ? "default" : "red"}
        />
      </div>
    </div>
  );
}

export default MetricsPanel;
