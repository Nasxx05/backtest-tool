/**
 * Layout Component
 *
 * Wraps every page with consistent structure:
 * - Navbar at the top
 * - Main content area in the middle
 * - Footer at the bottom
 *
 * The {children} prop is whatever page component is currently active.
 */

import React from "react";
import Navbar from "./Navbar";

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top navigation bar */}
      <Navbar />

      {/* Main content area - grows to fill available space */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>Backtest Tool &mdash; Test your trading strategies with historical data</p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
