// src/theme.js
import { createTheme, alpha } from "@mui/material/styles";

export const getTheme = (mode = "light") =>
  createTheme({
    palette: {
      mode,
      primary: { main: "#2563eb" },
      secondary: { main: "#0ea5e9" },
      background: {
        default: mode === "light" ? "#f7f7fb" : "#0b1220",
        paper: mode === "light" ? "#ffffff" : "#0f172a",
      },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: [
        "Inter",
        "system-ui",
        "Segoe UI",
        "Roboto",
        "Helvetica Neue",
        "Arial",
      ].join(","),
      h6: { fontWeight: 600 },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            backdropFilter: "blur(8px)",
            backgroundColor: alpha(theme.palette.background.paper, 0.75),
            boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.1)",
          }),
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.mode === "light"
              ? "#f9fafb"
              : theme.palette.background.paper,
            position: "sticky",
            top: 0,
            zIndex: 1,
          }),
        },
      },
    },
  });
