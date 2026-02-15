/**
 * LoadingSpinner Component
 *
 * Shows an animated spinner while data is loading.
 * Can optionally display a message below the spinner.
 *
 * Props:
 *   message: Optional text to show (e.g., "Running backtest...")
 */

import React from "react";

function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Spinning circle animation */}
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>

      {/* Loading message */}
      <p className="mt-4 text-sm text-gray-500">{message}</p>
    </div>
  );
}

export default LoadingSpinner;
