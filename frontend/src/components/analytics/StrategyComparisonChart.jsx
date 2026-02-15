/**
 * StrategyComparisonChart Component
 *
 * A grouped bar chart comparing strategies across key metrics:
 * - Average return
 * - Win rate
 * - Sharpe ratio
 *
 * Props:
 *   data: Array of strategy comparison objects from the analytics API
 */

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function StrategyComparisonChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-500">
        <p>No strategy comparison data yet. Run backtests with different strategies!</p>
      </div>
    );
  }

  // Format strategy names for display
  const chartData = data.map((item) => ({
    name: item.strategy.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    "Avg Return (%)": item.avg_return,
    "Win Rate (%)": item.avg_win_rate,
    "Sharpe Ratio": item.avg_sharpe,
    backtests: item.total_backtests,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Strategy Comparison
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />

          <Bar
            dataKey="Avg Return (%)"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="Win Rate (%)"
            fill="#22c55e"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="Sharpe Ratio"
            fill="#f59e0b"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default StrategyComparisonChart;
