import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { DashboardProvider } from "./context/DashboardContext";
import { TimerProvider } from "./context/TimerContext";

import "./styles/global.css";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DashboardProvider>
          <TimerProvider><App /></TimerProvider>
      </DashboardProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
