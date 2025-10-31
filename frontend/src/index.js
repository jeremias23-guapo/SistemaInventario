import React, { useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";

import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { getTheme } from "./theme"; // importa tu theme.js

const Root = () => {
  const [mode, setMode] = useState("light");
  const theme = useMemo(() => getTheme(mode), [mode]);

  const toggleTheme = () => setMode((prev) => (prev === "light" ? "dark" : "light"));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          {/* pasa toggleTheme a App para que el Layout pueda usarlo */}
          <App toggleTheme={toggleTheme} mode={mode} />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<Root />);
