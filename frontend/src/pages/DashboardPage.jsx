/**
 * DashboardPage - The Main Page
 *
 * This is the landing page where users set up and run backtests.
 * It contains:
 *   1. Asset selector (pick which stock/crypto/forex to test)
 *   2. Strategy builder (choose and configure a strategy)
 *   3. Date range picker (set the test period)
 *   4. Capital input and "Run Backtest" button
 *   5. Recent backtest history list
 *
 * When a backtest completes, the user is redirected to the
 * Results page to see the full results.
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AssetSelector from "../components/dashboard/AssetSelector";
import StrategyBuilder from "../components/dashboard/StrategyBuilder";
import DateRangePicker from "../components/dashboard/DateRangePicker";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import ErrorMessage from "../components/shared/ErrorMessage";
import {
  getAssets,
  getStrategies,
  runBacktest,
  getBacktestHistory,
  fetchAssetData,
  getDataStatus,
} from "../services/api";

function DashboardPage() {
  // React Router hook for programmatic navigation
  const navigate = useNavigate();

  // ----- State Variables -----
  // These track what the user has selected and the app's loading state.

  // Data from the API
  const [assets, setAssets] = useState([]);
  const [strategies, setStrategies] = useState({});
  const [recentBacktests, setRecentBacktests] = useState([]);

  // User selections
  const [selectedAsset, setSelectedAsset] = useState("");
  const [selectedStrategy, setSelectedStrategy] = useState("");
  const [strategyParams, setStrategyParams] = useState({});
  const [dateRange, setDateRange] = useState({
    startDate: "2015-01-01",
    endDate: new Date().toISOString().split("T")[0], // Today's date
  });
  const [initialCapital, setInitialCapital] = useState(10000);

  // UI state
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [error, setError] = useState(null);
  const [dataStatus, setDataStatus] = useState(null);

  // ----- Load Initial Data -----
  // When the page first loads, fetch assets, strategies, and history
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        // Fetch all three in parallel for speed
        const [assetsData, strategiesData, historyData] = await Promise.all([
          getAssets(),
          getStrategies(),
          getBacktestHistory(5),
        ]);

        setAssets(assetsData);
        setStrategies(strategiesData);
        setRecentBacktests(historyData);
      } catch (err) {
        setError("Failed to load data. Is the backend server running?");
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []); // Empty array = run once when component mounts

  // ----- Check Data Status When Asset Changes -----
  // When the user picks an asset, check if we have price data for it
  useEffect(() => {
    if (!selectedAsset) {
      setDataStatus(null);
      return;
    }

    async function checkData() {
      try {
        const status = await getDataStatus(selectedAsset);
        setDataStatus(status);
      } catch (err) {
        console.error("Status check error:", err);
      }
    }

    checkData();
  }, [selectedAsset]);

  // ----- Reset Params When Strategy Changes -----
  // When the user picks a different strategy, reset params to defaults
  const handleStrategyChange = (strategyKey) => {
    setSelectedStrategy(strategyKey);

    if (strategyKey && strategies[strategyKey]) {
      // Set all params to their default values
      const defaults = {};
      Object.entries(strategies[strategyKey].params).forEach(
        ([key, info]) => {
          defaults[key] = info.default;
        }
      );
      setStrategyParams(defaults);
    } else {
      setStrategyParams({});
    }
  };

  // ----- Fetch Historical Data -----
  // Download price data from Yahoo Finance for the selected asset
  const handleFetchData = async () => {
    try {
      setFetchingData(true);
      setError(null);
      await fetchAssetData(selectedAsset);

      // Refresh the data status
      const status = await getDataStatus(selectedAsset);
      setDataStatus(status);
    } catch (err) {
      setError(`Failed to fetch data for ${selectedAsset}: ${err.message}`);
    } finally {
      setFetchingData(false);
    }
  };

  // ----- Run Backtest -----
  // Execute the backtest with current settings and navigate to results
  const handleRunBacktest = async () => {
    // Validate inputs
    if (!selectedAsset) {
      setError("Please select an asset");
      return;
    }
    if (!selectedStrategy) {
      setError("Please select a strategy");
      return;
    }

    try {
      setRunning(true);
      setError(null);

      const result = await runBacktest({
        symbol: selectedAsset,
        strategy: selectedStrategy,
        params: strategyParams,
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        initial_capital: initialCapital,
      });

      // Store result in sessionStorage so the Results page can read it
      sessionStorage.setItem("backtestResult", JSON.stringify(result));

      // Navigate to the results page
      navigate("/results");
    } catch (err) {
      const message =
        err.response?.data?.error || err.message || "Backtest failed";
      setError(message);
    } finally {
      setRunning(false);
    }
  };

  // ----- Render -----
  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Backtest Dashboard
        </h1>
        <p className="text-gray-500 mt-1">
          Select an asset and strategy, then run a backtest to see how it
          would have performed.
        </p>
      </div>

      {/* Error Display */}
      {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

      {/* Main Configuration Panel */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Configure Backtest
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Asset + Strategy */}
          <div className="space-y-6">
            {/* Asset Selector */}
            <AssetSelector
              assets={assets}
              selectedAsset={selectedAsset}
              onChange={setSelectedAsset}
              loading={loading}
            />

            {/* Data Status Indicator */}
            {dataStatus && (
              <div
                className={`rounded-lg p-3 text-sm ${
                  dataStatus.has_data
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {dataStatus.has_data ? (
                  <p>
                    Data available: {dataStatus.earliest_date} to{" "}
                    {dataStatus.latest_date} ({dataStatus.total_rows} days)
                  </p>
                ) : (
                  <div>
                    <p className="mb-2">
                      No data found for {selectedAsset}. Download it first.
                    </p>
                    <button
                      onClick={handleFetchData}
                      disabled={fetchingData}
                      className="px-3 py-1.5 bg-amber-600 text-white rounded-lg
                                 text-xs font-medium hover:bg-amber-700
                                 disabled:opacity-50 transition-colors"
                    >
                      {fetchingData
                        ? "Downloading..."
                        : "Download Historical Data"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Strategy Builder */}
            <StrategyBuilder
              strategies={strategies}
              selectedStrategy={selectedStrategy}
              strategyParams={strategyParams}
              onStrategyChange={handleStrategyChange}
              onParamsChange={setStrategyParams}
            />
          </div>

          {/* Right Column: Dates + Capital + Button */}
          <div className="space-y-6">
            {/* Date Range */}
            <DateRangePicker
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onChange={setDateRange}
            />

            {/* Initial Capital */}
            <div>
              <label
                htmlFor="capital"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Initial Capital ($)
              </label>
              <input
                id="capital"
                type="number"
                value={initialCapital}
                min={100}
                step={1000}
                onChange={(e) =>
                  setInitialCapital(parseInt(e.target.value, 10) || 10000)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg
                           text-sm focus:ring-2 focus:ring-indigo-500
                           focus:border-indigo-500"
              />
            </div>

            {/* Run Backtest Button */}
            <button
              onClick={handleRunBacktest}
              disabled={running || !selectedAsset || !selectedStrategy}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl
                         font-semibold text-lg hover:bg-indigo-700
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors shadow-sm"
            >
              {running ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg
                    className="w-5 h-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span>Running Backtest...</span>
                </span>
              ) : (
                "Run Backtest"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Recent Backtests History */}
      {recentBacktests.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Backtests
            </h2>
          </div>

          <div className="divide-y divide-gray-100">
            {recentBacktests.map((bt) => (
              <div
                key={bt.id}
                className="px-6 py-4 flex items-center justify-between
                           hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {bt.symbol}{" "}
                    <span className="text-gray-400">|</span>{" "}
                    {bt.strategy_name.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {bt.start_date} to {bt.end_date}
                  </p>
                </div>

                <div className="text-right">
                  <p
                    className={`font-bold ${
                      bt.total_return >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {bt.total_return >= 0 ? "+" : ""}
                    {bt.total_return}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {bt.total_trades} trades
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
