import React from 'react';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon,
  ListItemText, Toolbar, AppBar, Typography
} from '@mui/material';
import {
  Inventory2,
  ShoppingCart,
  Category,
  MonetizationOn,
  People,
  Business,
  History,
  Label
} from '@mui/icons-material';
import { Outlet, useNavigate } from 'react-router-dom';

const drawerWidth = 240;

export default function Layout() {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Top AppBar */}
      <AppBar position="fixed" sx={{ zIndex: theme => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Sistema de Inventario
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' }
        }}
      >
        <Toolbar />
        <List>
          <ListItemButton onClick={() => navigate('/productos')}>
            <ListItemIcon><Inventory2 /></ListItemIcon>
            <ListItemText primary="Productos" />
          </ListItemButton>

          <ListItemButton onClick={() => navigate('/ordenes_compra')}>
            <ListItemIcon><ShoppingCart /></ListItemIcon>
            <ListItemText primary="Órdenes de compra" />
          </ListItemButton>

          <ListItemButton onClick={() => navigate('/categorias')}>
            <ListItemIcon><Category /></ListItemIcon>
            <ListItemText primary="Categorías" />
          </ListItemButton>

          <ListItemButton onClick={() => navigate('/ventas')}>
            <ListItemIcon><MonetizationOn /></ListItemIcon>
            <ListItemText primary="Ventas" />
          </ListItemButton>

          <ListItemButton onClick={() => navigate('/clientes')}>
            <ListItemIcon><People /></ListItemIcon>
            <ListItemText primary="Clientes" />
          </ListItemButton>

          <ListItemButton onClick={() => navigate('/proveedores')}>
            <ListItemIcon><Business /></ListItemIcon>
            <ListItemText primary="Proveedores" />
          </ListItemButton>

          <ListItemButton onClick={() => navigate('/transacciones')}>
            <ListItemIcon><History /></ListItemIcon>
            <ListItemText primary="Historial" />
          </ListItemButton>

          <ListItemButton onClick={() => navigate('/marcas')}>
            <ListItemIcon><Label /></ListItemIcon>
            <ListItemText primary="Marcas" />
          </ListItemButton>

          <ListItemButton onClick={() => navigate('/usuarios')}>
            <ListItemIcon><Label /></ListItemIcon>
            <ListItemText primary="Usuarios" />
          </ListItemButton>
        </List>
        
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
);
}
