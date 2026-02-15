/**
 * App Component - The Root of Our React Application
 *
 * This component sets up the page routing (which URL shows which page)
 * and wraps everything in our shared layout (navbar + footer).
 *
 * Routes:
 *   /           -> Dashboard (main page with strategy builder)
 *   /results    -> Results page (shows backtest results)
 *   /analytics  -> Analytics dashboard
 */

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import DashboardPage from "./pages/DashboardPage";
import ResultsPage from "./pages/ResultsPage";
import AnalyticsPage from "./pages/AnalyticsPage";

function App() {
  return (
    <Router>
      {/* Layout wraps all pages with navbar + footer */}
      <Layout>
        <Routes>
          {/* Main dashboard - strategy builder */}
          <Route path="/" element={<DashboardPage />} />

          {/* Backtest results display */}
          <Route path="/results" element={<ResultsPage />} />

          {/* Analytics and performance tracking */}
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
