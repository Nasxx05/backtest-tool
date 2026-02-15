/**
 * API Service Layer
 *
 * This file contains all the functions that talk to our Flask backend.
 * Instead of making API calls directly in our components, we put them
 * all here in one place. This makes the code cleaner and easier to
 * maintain - if the API changes, we only update this one file.
 *
 * Each function returns a Promise that resolves to the response data.
 */

import axios from "axios";

// Base URL for our backend API
// In development, React runs on port 3000 and Flask on port 5000
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Create an axios instance with default settings
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// =============================================================
// ASSETS API
// =============================================================

/**
 * Fetch all available assets (stocks, crypto, forex).
 * @param {string} type - Optional filter: "stock", "crypto", or "forex"
 * @returns {Promise<Array>} List of asset objects
 */
export async function getAssets(type = null) {
  const params = type ? { type } : {};
  const response = await api.get("/assets/", { params });
  return response.data;
}

/**
 * Get historical price data for a specific asset.
 * @param {string} symbol - Ticker symbol (e.g., "AAPL")
 * @param {string} startDate - Start date "YYYY-MM-DD"
 * @param {string} endDate - End date "YYYY-MM-DD"
 * @returns {Promise<Object>} Object with symbol, count, and data array
 */
export async function getAssetData(symbol, startDate, endDate) {
  const params = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  const response = await api.get(`/assets/${symbol}/data`, { params });
  return response.data;
}

/**
 * Download historical data from Yahoo Finance for an asset.
 * @param {string} symbol - Ticker symbol
 * @param {string} startDate - Optional start date
 * @param {string} endDate - Optional end date
 * @returns {Promise<Object>} Result with rows_added count
 */
export async function fetchAssetData(symbol, startDate, endDate) {
  const body = {};
  if (startDate) body.start_date = startDate;
  if (endDate) body.end_date = endDate;
  const response = await api.post(`/assets/${symbol}/fetch`, body);
  return response.data;
}

/**
 * Check data availability for an asset.
 * @param {string} symbol - Ticker symbol
 * @returns {Promise<Object>} Status with has_data, date range, etc.
 */
export async function getDataStatus(symbol) {
  const response = await api.get(`/assets/${symbol}/status`);
  return response.data;
}

// =============================================================
// BACKTEST API
// =============================================================

/**
 * Get all available trading strategies and their parameters.
 * @returns {Promise<Object>} Strategies keyed by name
 */
export async function getStrategies() {
  const response = await api.get("/backtest/strategies");
  return response.data;
}

/**
 * Run a backtest with the given parameters.
 * @param {Object} params - Backtest configuration
 * @param {string} params.symbol - Asset to test
 * @param {string} params.strategy - Strategy name
 * @param {Object} params.params - Strategy parameters
 * @param {string} params.start_date - Start date
 * @param {string} params.end_date - End date
 * @param {number} params.initial_capital - Starting capital
 * @returns {Promise<Object>} Full backtest results
 */
export async function runBacktest(params) {
  const response = await api.post("/backtest/run", params);
  return response.data;
}

/**
 * Get list of past backtest results.
 * @param {number} limit - Max results to return
 * @returns {Promise<Array>} List of backtest result objects
 */
export async function getBacktestHistory(limit = 20) {
  const response = await api.get("/backtest/history", { params: { limit } });
  return response.data;
}

/**
 * Get detailed results for a specific backtest.
 * @param {number} id - Backtest ID
 * @returns {Promise<Object>} Full backtest details with trades
 */
export async function getBacktestDetail(id) {
  const response = await api.get(`/backtest/${id}`);
  return response.data;
}

// =============================================================
// ANALYTICS API
// =============================================================

/**
 * Get performance data over time for charting.
 * @param {number} limit - Max data points
 * @returns {Promise<Array>} Performance records
 */
export async function getPerformanceHistory(limit = 50) {
  const response = await api.get("/analytics/performance", {
    params: { limit },
  });
  return response.data;
}

/**
 * Get ranking of best performing asset/strategy pairs.
 * @returns {Promise<Array>} Ranked list of pairs
 */
export async function getBestPairs() {
  const response = await api.get("/analytics/best-pairs");
  return response.data;
}

/**
 * Get comparison data across all strategies.
 * @returns {Promise<Array>} Strategy comparison stats
 */
export async function getStrategyComparison() {
  const response = await api.get("/analytics/strategy-comparison");
  return response.data;
}

/**
 * Get high-level analytics summary.
 * @returns {Promise<Object>} Summary statistics
 */
export async function getAnalyticsSummary() {
  const response = await api.get("/analytics/summary");
  return response.data;
}
