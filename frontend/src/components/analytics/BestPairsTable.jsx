/**
 * BestPairsTable Component
 *
 * Displays a ranked table of the best performing asset/strategy
 * combinations. Helps users identify which pairs consistently
 * produce good results.
 *
 * Props:
 *   data: Array of best pairs objects from the analytics API
 */

import React from "react";

function BestPairsTable({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-500">
        <p>No ranking data yet. Run some backtests first!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Best Performing Pairs
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Rank</th>
              <th className="px-4 py-3 text-left">Asset</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-right">Avg Return</th>
              <th className="px-4 py-3 text-right">Best Return</th>
              <th className="px-4 py-3 text-right">Avg Sharpe</th>
              <th className="px-4 py-3 text-left">Best Strategy</th>
              <th className="px-4 py-3 text-right">Tests</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {data.map((item, index) => (
              <tr key={item.symbol} className="hover:bg-gray-50">
                {/* Rank number with medal emoji for top 3 */}
                <td className="px-4 py-3 font-medium text-gray-500">
                  {index + 1}
                </td>

                {/* Asset symbol and name */}
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{item.symbol}</p>
                  <p className="text-xs text-gray-500">{item.name}</p>
                </td>

                {/* Asset type badge */}
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium
                    ${
                      item.asset_type === "stock"
                        ? "bg-blue-100 text-blue-700"
                        : item.asset_type === "crypto"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {item.asset_type}
                  </span>
                </td>

                {/* Average return */}
                <td
                  className={`px-4 py-3 text-right font-medium ${
                    item.avg_return >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {item.avg_return >= 0 ? "+" : ""}{item.avg_return}%
                </td>

                {/* Best return */}
                <td
                  className={`px-4 py-3 text-right ${
                    item.best_return >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {item.best_return >= 0 ? "+" : ""}{item.best_return}%
                </td>

                {/* Average Sharpe */}
                <td className="px-4 py-3 text-right text-gray-700">
                  {item.avg_sharpe}
                </td>

                {/* Best strategy */}
                <td className="px-4 py-3 text-gray-700">
                  {item.best_strategy
                    ? item.best_strategy.replace(/_/g, " ")
                    : "-"}
                </td>

                {/* Number of backtests */}
                <td className="px-4 py-3 text-right text-gray-500">
                  {item.total_backtests}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BestPairsTable;
