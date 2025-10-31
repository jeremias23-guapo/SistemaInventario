import * as React from "react";
import {
  AppBar,
  Avatar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  Paper,
  useMediaQuery,
  alpha,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";

import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import SellIcon from "@mui/icons-material/Sell";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CategoryIcon from "@mui/icons-material/Category";
import PeopleIcon from "@mui/icons-material/People";
import StoreIcon from "@mui/icons-material/Store";
import BrandingWatermarkIcon from "@mui/icons-material/BrandingWatermark";
import BarChartIcon from "@mui/icons-material/BarChart";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import LogoutIcon from "@mui/icons-material/Logout";
import DirectionsTransitIcon from "@mui/icons-material/DirectionsTransit"; // 👈 nuevo ícono

const DRAWER_WIDTH = 240;
const MINI_WIDTH = 72;
const Offset = styled("div")(({ theme }) => theme.mixins.toolbar);

const DrawerPaper = styled("div")(({ theme, open }) => ({
  position: "relative",
  whiteSpace: "nowrap",
  width: open ? DRAWER_WIDTH : MINI_WIDTH,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  boxSizing: "border-box",
  overflowX: "hidden",
  ...(open
    ? {}
    : {
        transition: theme.transitions.create("width", {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
      }),
}));

const Shell = styled("div")(({ theme, open }) => ({
  display: "flex",
  height: "100vh",
  overflow: "hidden",
  background: theme.palette.background.default,
  "& .content": {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: theme.spacing(2),
    marginLeft: open ? DRAWER_WIDTH : MINI_WIDTH,
    transition: theme.transitions.create("margin-left", {
      duration: theme.transitions.duration.standard,
    }),
    [theme.breakpoints.down("md")]: { marginLeft: 0 },
    overflow: "hidden",
    height: "100vh",
    maxWidth: 1600,
  },
}));

// 🧭 Navegación lateral (Drawer)
const items = [
  { to: "/productos", label: "Productos", icon: <Inventory2Icon /> },
  { to: "/ventas", label: "Ventas", icon: <SellIcon /> },
  { to: "/ordenes_compra", label: "Órdenes de compra", icon: <AssignmentIcon /> },
  { to: "/categorias", label: "Categorías", icon: <CategoryIcon /> },
  { to: "/clientes", label: "Clientes", icon: <PeopleIcon /> },
  { to: "/proveedores", label: "Proveedores", icon: <StoreIcon /> },
  { to: "/marcas", label: "Marcas", icon: <BrandingWatermarkIcon /> },
  { to: "/transacciones", label: "Transacciones", icon: <SwapHorizIcon /> },
  { to: "/transportistas", label: "Transportistas", icon: <LocalShippingIcon /> },

  // 👇 NUEVA SECCIÓN PARA ENCOMENDISTAS
  { to: "/encomendistas", label: "Encomendistas", icon: <DirectionsTransitIcon /> },

  { to: "/reportes", label: "Reportes", icon: <BarChartIcon /> },
];

export default function Layout({ toggleTheme, mode }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [open, setOpen] = React.useState(true);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleToggleDrawer = () => setOpen((o) => !o);
  const handleMobileToggle = () => setMobileOpen((m) => !m);

  React.useEffect(() => {
    if (mobileOpen) setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const AppTopBar = (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backdropFilter: "blur(8px)",
        backgroundColor: (t) => alpha(t.palette.background.paper, 0.8),
        borderBottom: (t) => `1px solid ${alpha(t.palette.divider, 0.3)}`,
        ml: { md: open ? `${DRAWER_WIDTH}px` : `${MINI_WIDTH}px` },
        width: { md: open ? `calc(100% - ${DRAWER_WIDTH}px)` : `calc(100% - ${MINI_WIDTH}px)` },
      }}
    >
      <Toolbar sx={{ gap: 1 }}>
        <IconButton
          color="inherit"
          edge="start"
          onClick={isMobile ? handleMobileToggle : handleToggleDrawer}
          sx={{ mr: 1, display: { md: "none" } }}
        >
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 700 }}>
          Sistema de Inventario
        </Typography>

        <Tooltip title={mode === "light" ? "Modo oscuro" : "Modo claro"}>
          <IconButton color="inherit" onClick={toggleTheme}>
            {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Cuenta">
          <IconButton onClick={() => navigate("/usuarios")}>
            <Avatar sx={{ width: 32, height: 32 }}>A</Avatar>
          </IconButton>
        </Tooltip>

        <Tooltip title="Cerrar sesión">
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );

  const DrawerContent = (
    <DrawerPaper open={open}>
      <Toolbar
        disableGutters
        sx={{
          px: 1,
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: open ? "space-between" : "center",
        }}
      >
        {open ? (
          <Typography sx={{ fontWeight: 700, ml: 1 }}>Inventario</Typography>
        ) : (
          <Inventory2Icon />
        )}
        <IconButton onClick={handleToggleDrawer} sx={{ display: { xs: "none", md: "inline-flex" } }}>
          {theme.direction === "rtl" ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Toolbar>

      <Divider />
      <List sx={{ py: 1, flexGrow: 1 }}>
        {items.map((item) => {
          const active = location.pathname.startsWith(item.to);
          const button = (
            <ListItemButton
              key={item.to}
              component={NavLink}
              to={item.to}
              selected={active}
              sx={{
                mx: 1,
                borderRadius: 2,
                "&.Mui-selected": {
                  bgcolor: (t) =>
                    alpha(t.palette.primary.main, t.palette.mode === "light" ? 0.12 : 0.24),
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              {open && <ListItemText primary={item.label} />}
            </ListItemButton>
          );
          return open ? (
            button
          ) : (
            <Tooltip key={item.to} title={item.label} placement="right">
              {button}
            </Tooltip>
          );
        })}
      </List>

      <Divider />
      <ListItemButton
        onClick={handleLogout}
        sx={{
          mx: 1,
          my: 1,
          borderRadius: 2,
          color: "error.main",
        }}
      >
        <ListItemIcon>
          <LogoutIcon color="error" />
        </ListItemIcon>
        {open && <ListItemText primary="Cerrar sesión" />}
      </ListItemButton>
    </DrawerPaper>
  );

  return (
    <Shell open={!isMobile && open}>
      <CssBaseline />
      {AppTopBar}

      {/* Drawer fijo en desktop */}
      <Box
        component={Paper}
        elevation={4}
        square
        sx={{
          display: { xs: "none", md: "block" },
          position: "fixed",
          left: 0,
          top: 0,
          height: "100vh",
          zIndex: (t) => t.zIndex.drawer,
        }}
      >
        {DrawerContent}
      </Box>

      {/* Drawer móvil */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleMobileToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { width: DRAWER_WIDTH },
        }}
      >
        <Box sx={{ width: DRAWER_WIDTH }}>{DrawerContent}</Box>
      </Drawer>

      {/* Contenido principal */}
      <Box className="content" component="main">
        <Offset />
        <Outlet />
      </Box>
    </Shell>
  );
}
