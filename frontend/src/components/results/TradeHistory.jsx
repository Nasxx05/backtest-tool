/**
 * TradeHistory Component
 *
 * Displays a table of all trades from a backtest.
 * Each row shows the entry/exit details and profit/loss.
 * Winning trades are highlighted in green, losing in red.
 *
 * Props:
 *   trades: Array of trade objects from the backtest API
 */

import React from "react";

function TradeHistory({ trades }) {
  if (!trades || trades.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-500">
        No trades were executed
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Trade History ({trades.length} trades)
        </h3>
      </div>

      {/* Scrollable table container */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* Table header */}
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Entry Date</th>
              <th className="px-4 py-3 text-right">Entry Price</th>
              <th className="px-4 py-3 text-left">Exit Date</th>
              <th className="px-4 py-3 text-right">Exit Price</th>
              <th className="px-4 py-3 text-right">P&L ($)</th>
              <th className="px-4 py-3 text-right">P&L (%)</th>
            </tr>
          </thead>

          {/* Table body */}
          <tbody className="divide-y divide-gray-100">
            {trades.map((trade, index) => {
              // Determine if this trade was profitable
              const isProfit = trade.profit_loss > 0;
              const isLoss = trade.profit_loss < 0;

              return (
                <tr
                  key={index}
                  className={`hover:bg-gray-50 transition-colors ${
                    isProfit
                      ? "bg-green-50/50"
                      : isLoss
                      ? "bg-red-50/50"
                      : ""
                  }`}
                >
                  {/* Trade number */}
                  <td className="px-4 py-3 text-gray-500">{index + 1}</td>

                  {/* Entry date */}
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {trade.entry_date}
                  </td>

                  {/* Entry price */}
                  <td className="px-4 py-3 text-right text-gray-700">
                    ${trade.entry_price?.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </td>

                  {/* Exit date */}
                  <td className="px-4 py-3 text-gray-900">
                    {trade.exit_date || "Open"}
                  </td>

                  {/* Exit price */}
                  <td className="px-4 py-3 text-right text-gray-700">
                    {trade.exit_price
                      ? `$${trade.exit_price.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}`
                      : "-"}
                  </td>

                  {/* Dollar profit/loss */}
                  <td
                    className={`px-4 py-3 text-right font-medium ${
                      isProfit
                        ? "text-green-600"
                        : isLoss
                        ? "text-red-600"
                        : "text-gray-500"
                    }`}
                  >
                    {trade.profit_loss !== null
                      ? `${isProfit ? "+" : ""}$${trade.profit_loss.toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2 }
                        )}`
                      : "-"}
                  </td>

                  {/* Percentage profit/loss */}
                  <td
                    className={`px-4 py-3 text-right font-medium ${
                      isProfit
                        ? "text-green-600"
                        : isLoss
                        ? "text-red-600"
                        : "text-gray-500"
                    }`}
                  >
                    {trade.profit_loss_pct !== null
                      ? `${isProfit ? "+" : ""}${trade.profit_loss_pct.toFixed(2)}%`
                      : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TradeHistory;
