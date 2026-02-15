/**
 * AssetSelector Component
 *
 * A dropdown that lets users pick which asset to backtest.
 * Assets are grouped by type (Stocks, Crypto, Forex) for
 * easy browsing.
 *
 * Props:
 *   assets:        Array of asset objects from the API
 *   selectedAsset: Currently selected asset symbol
 *   onChange:      Callback when user selects a new asset
 *   loading:       Whether assets are still loading
 */

import React from "react";

function AssetSelector({ assets, selectedAsset, onChange, loading }) {
  // Group assets by type for the dropdown
  const grouped = {
    stock: assets.filter((a) => a.asset_type === "stock"),
    crypto: assets.filter((a) => a.asset_type === "crypto"),
    forex: assets.filter((a) => a.asset_type === "forex"),
  };

  return (
    <div>
      <label
        htmlFor="asset-select"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Select Asset
      </label>

      <select
        id="asset-select"
        value={selectedAsset}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg
                   bg-white text-gray-900 text-sm
                   focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                   disabled:bg-gray-100 disabled:text-gray-400"
      >
        <option value="">-- Choose an asset --</option>

        {/* Stocks group */}
        {grouped.stock.length > 0 && (
          <optgroup label="Stocks">
            {grouped.stock.map((asset) => (
              <option key={asset.symbol} value={asset.symbol}>
                {asset.symbol} - {asset.name}
              </option>
            ))}
          </optgroup>
        )}

        {/* Crypto group */}
        {grouped.crypto.length > 0 && (
          <optgroup label="Cryptocurrency">
            {grouped.crypto.map((asset) => (
              <option key={asset.symbol} value={asset.symbol}>
                {asset.symbol} - {asset.name}
              </option>
            ))}
          </optgroup>
        )}

        {/* Forex group */}
        {grouped.forex.length > 0 && (
          <optgroup label="Forex">
            {grouped.forex.map((asset) => (
              <option key={asset.symbol} value={asset.symbol}>
                {asset.symbol} - {asset.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  );
}

export default AssetSelector;
