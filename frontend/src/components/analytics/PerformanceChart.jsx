/**
 * PerformanceChart Component
 *
 * Shows a bar chart of backtest returns over time.
 * Green bars = profitable backtests, red bars = losing ones.
 * This helps users visualize their progress and see trends.
 *
 * Props:
 *   data: Array of performance records from the analytics API
 */

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";

function PerformanceChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-500">
        <p>No performance data yet. Run some backtests first!</p>
      </div>
    );
  }

  // Format data for the chart
  const chartData = data.map((item, index) => ({
    // Short label for x-axis
    label: `#${index + 1}`,
    return: item.total_return,
    symbol: item.symbol,
    strategy: item.strategy,
    date: item.date,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0].payload;

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
        <p className="font-medium text-gray-900">{data.symbol}</p>
        <p className="text-gray-500">{data.strategy}</p>
        <p
          className={`font-bold ${
            data.return >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {data.return >= 0 ? "+" : ""}{data.return}%
        </p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Backtest Returns Over Time
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          {/* Zero line */}
          <ReferenceLine y={0} stroke="#9ca3af" />

          <Bar dataKey="return" name="Return %" radius={[4, 4, 0, 0]}>
            {/* Color each bar based on positive/negative */}
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.return >= 0 ? "#22c55e" : "#ef4444"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PerformanceChart;
