/**
 * Entry Point - Where React starts rendering our app.
 *
 * This file is loaded by index.html and kicks off
 * the entire React application.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.css";

// Find the <div id="root"> in index.html and render our app inside it
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
