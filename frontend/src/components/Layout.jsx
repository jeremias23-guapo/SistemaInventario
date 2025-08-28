// src/components/Layout.jsx
import React, { useContext, useState } from 'react';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon,
  ListItemText, Toolbar, AppBar, Typography, IconButton,
  Menu, MenuItem, Divider
} from '@mui/material';
import {
  Inventory2, ShoppingCart, Category, MonetizationOn,
  People, Business, History, Label, Logout
} from '@mui/icons-material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { Outlet, useNavigate, useLocation } from 'react-router-dom'; // ⬅️ useLocation
import { AuthContext } from '../contexts/AuthContext';
import { useLoading } from '../contexts/LoadingContext';

const drawerWidth = 240;

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();                 // ⬅️ ruta actual
  const { start } = useLoading();
  const { user } = useContext(AuthContext);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  // ⬅️ Navegar SOLO si cambia la ruta
  const handleNav = (path) => {
    if (location.pathname === path) return; // ya estoy ahí: no hago nada (evita overlay colgado)
    start();
    navigate(path);
  };

  // helper para marcar activo en el menú
  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6" noWrap component="div">
            Sistema de Inventario
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {user && (
              <Typography variant="body2" sx={{ mr: 1 }}>
                {user.username || user.nombre || 'Usuario'}
              </Typography>
            )}
            <IconButton size="large" edge="end" color="inherit" onClick={handleMenuOpen}>
              <AccountCircle />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  handleLogout();
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Logout fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Cerrar sesión" />
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth, flexShrink: 0,
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' }
        }}
      >
        <Toolbar />
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <List sx={{ flexGrow: 1 }}>
            <ListItemButton
              onClick={() => handleNav('/productos')}
              selected={isActive('/productos')}
            >
              <ListItemIcon><Inventory2 /></ListItemIcon>
              <ListItemText primary="Productos" />
            </ListItemButton>

            <ListItemButton
              onClick={() => handleNav('/ordenes_compra')}
              selected={isActive('/ordenes_compra')}
            >
              <ListItemIcon><ShoppingCart /></ListItemIcon>
              <ListItemText primary="Órdenes de compra" />
            </ListItemButton>

            <ListItemButton
              onClick={() => handleNav('/categorias')}
              selected={isActive('/categorias')}
            >
              <ListItemIcon><Category /></ListItemIcon>
              <ListItemText primary="Categorías" />
            </ListItemButton>

            <ListItemButton
              onClick={() => handleNav('/ventas')}
              selected={isActive('/ventas')}
            >
              <ListItemIcon><MonetizationOn /></ListItemIcon>
              <ListItemText primary="Ventas" />
            </ListItemButton>

            <ListItemButton
              onClick={() => handleNav('/clientes')}
              selected={isActive('/clientes')}
            >
              <ListItemIcon><People /></ListItemIcon>
              <ListItemText primary="Clientes" />
            </ListItemButton>

            <ListItemButton
              onClick={() => handleNav('/proveedores')}
              selected={isActive('/proveedores')}
            >
              <ListItemIcon><Business /></ListItemIcon>
              <ListItemText primary="Proveedores" />
            </ListItemButton>

            <ListItemButton
              onClick={() => handleNav('/transacciones')}
              selected={isActive('/transacciones')}
            >
              <ListItemIcon><History /></ListItemIcon>
              <ListItemText primary="Historial" />
            </ListItemButton>

            <ListItemButton
              onClick={() => handleNav('/marcas')}
              selected={isActive('/marcas')}
            >
              <ListItemIcon><Label /></ListItemIcon>
              <ListItemText primary="Marcas" />
            </ListItemButton>

            {(user?.rol === 'admin' || user?.rol_id === 1) && (
              <ListItemButton
                onClick={() => handleNav('/usuarios')}
                selected={isActive('/usuarios')}
              >
                <ListItemIcon><People /></ListItemIcon>
                <ListItemText primary="Usuarios" />
              </ListItemButton>
            )}
          </List>

          <Divider />
          <List>
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon><Logout /></ListItemIcon>
              <ListItemText primary="Cerrar sesión" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
