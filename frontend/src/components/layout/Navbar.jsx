/**
 * Navbar Component
 *
 * The navigation bar at the top of every page. Shows:
 * - App logo/name on the left
 * - Navigation links on the right
 * - Mobile-friendly hamburger menu
 */

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

function Navbar() {
  // Track whether the mobile menu is open
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // useLocation tells us the current URL path
  // We use this to highlight the active nav link
  const location = useLocation();

  // Navigation links configuration
  const navLinks = [
    { path: "/", label: "Dashboard" },
    { path: "/results", label: "Results" },
    { path: "/analytics", label: "Analytics" },
  ];

  // Helper: check if a link is currently active
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side: Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              {/* Simple chart icon using SVG */}
              <svg
                className="w-8 h-8 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
              <span className="text-xl font-bold text-gray-900">
                BacktestTool
              </span>
            </Link>
          </div>

          {/* Desktop navigation links */}
          <div className="hidden sm:flex sm:items-center sm:space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${
                    isActive(link.path)
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile menu button (hamburger icon) */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {/* Show X when menu is open, hamburger when closed */}
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-2 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-lg text-sm font-medium
                  ${
                    isActive(link.path)
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
