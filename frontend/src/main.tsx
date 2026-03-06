import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider, CssBaseline } from "@mui/material";

import { App } from "./app/App";
import { configureApiClient } from "./api/client";
import { authStore } from "./app/state/authStore";
import { financialTheme } from "./theme/financialTheme";
import "./styles/global.css";

configureApiClient({
  getAccessToken: () => authStore.getState().accessToken,
  onUnauthorized: () => {
    authStore.getState().logout();
    window.location.assign("/login");
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={financialTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);

