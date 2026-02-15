/**
 * DateRangePicker Component
 *
 * Two date inputs for selecting the backtest date range.
 * Uses native HTML date inputs for simplicity and broad
 * browser support.
 *
 * Props:
 *   startDate: Current start date string "YYYY-MM-DD"
 *   endDate:   Current end date string "YYYY-MM-DD"
 *   onChange:  Callback with {startDate, endDate} when either changes
 */

import React from "react";

function DateRangePicker({ startDate, endDate, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Date Range
      </label>

      <div className="grid grid-cols-2 gap-3">
        {/* Start Date */}
        <div>
          <label
            htmlFor="start-date"
            className="block text-xs text-gray-500 mb-1"
          >
            From
          </label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) =>
              onChange({ startDate: e.target.value, endDate })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg
                       text-sm focus:ring-2 focus:ring-indigo-500
                       focus:border-indigo-500"
          />
        </div>

        {/* End Date */}
        <div>
          <label
            htmlFor="end-date"
            className="block text-xs text-gray-500 mb-1"
          >
            To
          </label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) =>
              onChange({ startDate, endDate: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg
                       text-sm focus:ring-2 focus:ring-indigo-500
                       focus:border-indigo-500"
          />
        </div>
      </div>
    </div>
  );
}

export default DateRangePicker;
