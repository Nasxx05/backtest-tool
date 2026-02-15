/**
 * MetricCard Component
 *
 * A small card that displays a single metric value with a label.
 * Used on the results page to show things like "Total Return: 25.5%"
 *
 * Props:
 *   title:  The metric name (e.g., "Total Return")
 *   value:  The metric value (e.g., "25.50%")
 *   subtitle: Optional extra info below the value
 *   color:  "green", "red", or "default" to color the value
 */

import React from "react";

function MetricCard({ title, value, subtitle, color = "default" }) {
  // Choose text color based on the color prop
  const colorClasses = {
    green: "text-green-600",
    red: "text-red-600",
    default: "text-gray-900",
  };

  const bgClasses = {
    green: "bg-green-50 border-green-200",
    red: "bg-red-50 border-red-200",
    default: "bg-white border-gray-200",
  };

  return (
    <div className={`rounded-xl border p-5 ${bgClasses[color]}`}>
      {/* Metric label */}
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>

      {/* Metric value - displayed large and bold */}
      <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>

      {/* Optional subtitle */}
      {subtitle && (
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

export default MetricCard;
