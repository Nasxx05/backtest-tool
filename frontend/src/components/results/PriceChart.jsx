/**
 * PriceChart Component
 *
 * An interactive chart showing:
 * - The asset's closing price over time (blue line)
 * - Portfolio value over time (green line)
 * - Buy markers (green dots) and sell markers (red dots)
 * - Optional indicator overlays (SMA, Bollinger Bands, etc.)
 *
 * Uses the Recharts library for rendering.
 *
 * Props:
 *   chartData: Array of data points from the backtest API
 *   trades:    Array of trade objects (for buy/sell markers)
 */

import React, { useMemo } from "react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Scatter,
} from "recharts";

function PriceChart({ chartData, trades }) {
  // Prepare buy/sell marker data points
  // We match each trade to its closest chart data point
  const markers = useMemo(() => {
    if (!trades || !chartData) return { buys: [], sells: [] };

    const buys = [];
    const sells = [];

    trades.forEach((trade) => {
      // Find the chart data point closest to the trade entry date
      const entryPoint = chartData.find((d) => d.date === trade.entry_date);
      if (entryPoint) {
        buys.push({ ...entryPoint, markerPrice: trade.entry_price });
      }

      // Find the chart data point closest to the trade exit date
      if (trade.exit_date) {
        const exitPoint = chartData.find((d) => d.date === trade.exit_date);
        if (exitPoint) {
          sells.push({ ...exitPoint, markerPrice: trade.exit_price });
        }
      }
    });

    return { buys, sells };
  }, [trades, chartData]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-500">
        No chart data available
      </div>
    );
  }

  // Sample the data if there are too many points (for performance)
  // Show at most 500 data points on the chart
  const sampledData = useMemo(() => {
    if (chartData.length <= 500) return chartData;
    const step = Math.ceil(chartData.length / 500);
    return chartData.filter((_, index) => index % step === 0);
  }, [chartData]);

  // Detect which indicators are present in the data
  const hasShortSMA = chartData.some((d) => d.short_sma !== undefined);
  const hasLongSMA = chartData.some((d) => d.long_sma !== undefined);
  const hasBBUpper = chartData.some((d) => d.bb_upper !== undefined);
  const hasBBLower = chartData.some((d) => d.bb_lower !== undefined);

  // Custom tooltip that shows price info when hovering
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
        <p className="font-medium text-gray-900 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: ${Number(entry.value).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Price & Portfolio Chart
      </h3>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={sampledData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

          {/* X axis: dates */}
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(date) => {
              // Show just month/year for cleaner labels
              const d = new Date(date);
              return `${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
            }}
            interval="preserveStartEnd"
            minTickGap={50}
          />

          {/* Left Y axis: price */}
          <YAxis
            yAxisId="price"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `$${v.toLocaleString()}`}
            domain={["auto", "auto"]}
          />

          {/* Right Y axis: portfolio value */}
          <YAxis
            yAxisId="portfolio"
            orientation="right"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `$${v.toLocaleString()}`}
            domain={["auto", "auto"]}
          />

          <Tooltip content={<CustomTooltip />} />
          <Legend />

          {/* Bollinger Bands (shaded area) */}
          {hasBBUpper && hasBBLower && (
            <Area
              yAxisId="price"
              type="monotone"
              dataKey="bb_upper"
              stroke="none"
              fill="#e0e7ff"
              fillOpacity={0.3}
              name="BB Upper"
            />
          )}
          {hasBBLower && (
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="bb_lower"
              stroke="#a5b4fc"
              strokeWidth={1}
              dot={false}
              name="BB Lower"
              strokeDasharray="3 3"
            />
          )}

          {/* Close price line */}
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="close"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="Price"
          />

          {/* SMA lines */}
          {hasShortSMA && (
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="short_sma"
              stroke="#f59e0b"
              strokeWidth={1.5}
              dot={false}
              name="Short SMA"
            />
          )}
          {hasLongSMA && (
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="long_sma"
              stroke="#ef4444"
              strokeWidth={1.5}
              dot={false}
              name="Long SMA"
            />
          )}

          {/* Portfolio value line */}
          <Line
            yAxisId="portfolio"
            type="monotone"
            dataKey="portfolio_value"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            name="Portfolio"
            strokeDasharray="5 5"
          />

          {/* Buy markers */}
          <Scatter
            yAxisId="price"
            data={markers.buys}
            dataKey="markerPrice"
            name="Buy"
            fill="#22c55e"
            shape="triangle"
          />

          {/* Sell markers */}
          <Scatter
            yAxisId="price"
            data={markers.sells}
            dataKey="markerPrice"
            name="Sell"
            fill="#ef4444"
            shape="diamond"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PriceChart;
