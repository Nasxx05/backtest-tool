/**
 * StrategyBuilder Component
 *
 * Lets users choose a trading strategy and configure its parameters.
 * Dynamically renders parameter inputs based on the strategy's
 * parameter definitions from the API.
 *
 * Props:
 *   strategies:       Object of available strategies from the API
 *   selectedStrategy: Currently selected strategy key
 *   strategyParams:   Current parameter values
 *   onStrategyChange: Callback when strategy selection changes
 *   onParamsChange:   Callback when a parameter value changes
 */

import React from "react";

function StrategyBuilder({
  strategies,
  selectedStrategy,
  strategyParams,
  onStrategyChange,
  onParamsChange,
}) {
  // Get the selected strategy's info (name, description, params)
  const strategyInfo = selectedStrategy
    ? strategies[selectedStrategy]
    : null;

  return (
    <div className="space-y-4">
      {/* Strategy Selection Dropdown */}
      <div>
        <label
          htmlFor="strategy-select"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Trading Strategy
        </label>

        <select
          id="strategy-select"
          value={selectedStrategy}
          onChange={(e) => onStrategyChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg
                     bg-white text-gray-900 text-sm
                     focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">-- Choose a strategy --</option>
          {Object.entries(strategies).map(([key, info]) => (
            <option key={key} value={key}>
              {info.name}
            </option>
          ))}
        </select>
      </div>

      {/* Strategy Description */}
      {strategyInfo && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
          <p className="text-sm text-indigo-700">{strategyInfo.description}</p>
        </div>
      )}

      {/* Dynamic Parameter Inputs */}
      {strategyInfo && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">
            Strategy Parameters
          </p>

          {Object.entries(strategyInfo.params).map(([paramKey, paramInfo]) => (
            <div key={paramKey}>
              <label
                htmlFor={`param-${paramKey}`}
                className="block text-xs font-medium text-gray-500 mb-1"
              >
                {paramInfo.label}
              </label>

              <input
                id={`param-${paramKey}`}
                type="number"
                // Use the current value, or fall back to default
                value={
                  strategyParams[paramKey] !== undefined
                    ? strategyParams[paramKey]
                    : paramInfo.default
                }
                min={paramInfo.min}
                max={paramInfo.max}
                step={paramInfo.type === "float" ? 0.1 : 1}
                onChange={(e) => {
                  // Parse the input value to the correct type
                  const value =
                    paramInfo.type === "float"
                      ? parseFloat(e.target.value)
                      : parseInt(e.target.value, 10);

                  onParamsChange({
                    ...strategyParams,
                    [paramKey]: value,
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg
                           text-sm focus:ring-2 focus:ring-indigo-500
                           focus:border-indigo-500"
              />

              {/* Show the valid range below the input */}
              <p className="text-xs text-gray-400 mt-0.5">
                Range: {paramInfo.min} - {paramInfo.max} (default:{" "}
                {paramInfo.default})
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StrategyBuilder;
