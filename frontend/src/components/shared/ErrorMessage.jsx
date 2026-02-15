/**
 * ErrorMessage Component
 *
 * Displays an error message in a styled red box.
 * Used whenever an API call fails or something goes wrong.
 *
 * Props:
 *   message: The error text to display
 *   onRetry: Optional callback function for a "Try Again" button
 */

import React from "react";

function ErrorMessage({ message, onRetry }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      {/* Error icon */}
      <svg
        className="w-10 h-10 text-red-400 mx-auto mb-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>

      {/* Error text */}
      <p className="text-red-700 font-medium">{message}</p>

      {/* Optional retry button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg
                     hover:bg-red-200 text-sm font-medium transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;
