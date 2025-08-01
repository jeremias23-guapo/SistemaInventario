// src/App.js
import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import { AuthContext } from './contexts/AuthContext';

import Productos from './pages/Productos';
import ProductoForm from './pages/ProductoForm';
import Clientes from './pages/Clientes';
import ClienteForm from './pages/ClienteForm';
import Categorias from './pages/Categorias';
import CategoriaForm from './pages/CategoriasForm';
import Marcas from './pages/Marcas';
import MarcasForm from './pages/MarcasForm';
import Proveedores from './pages/Proveedores';
import ProveedoresForm from './pages/ProveedoresForm';
import Ventas from './pages/Ventas';
import VentaForm from './pages/VentaForm';
import VentaDetalle from './pages/VentaDetalle';
import Transacciones from './pages/Transacciones';
import OrdenesCompra from './pages/OrdenesCompras';
import OrdenCompraForm from './pages/OrdenCompraForm';
import OrdenCompraDetalle from './pages/OrdenCompraDetalle';
import Usuarios from './pages/Usuarios';
import UsuarioForm from './pages/UsuarioForm';

// Wrapper de rutas privadas
function PrivateRoute({ children }) {
  const { token } = useContext(AuthContext);
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/login" element={<Login />} />

      {/* Rutas protegidas */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        {/* Redirige / a /productos */}
        <Route index element={<Navigate to="productos" replace />} />

        {/* Productos */}
        <Route path="productos" element={<Productos />} />
        <Route path="productos/nuevo" element={<ProductoForm />} />
        <Route path="productos/editar/:id" element={<ProductoForm />} />

        {/* Clientes */}
        <Route path="clientes" element={<Clientes />} />
        <Route path="clientes/nuevo" element={<ClienteForm />} />
        <Route path="clientes/editar/:id" element={<ClienteForm />} />

        {/* Categorías */}
        <Route path="categorias" element={<Categorias />} />
        <Route path="categorias/nuevo" element={<CategoriaForm />} />
        <Route path="categorias/editar/:id" element={<CategoriaForm />} />

        {/* Marcas */}
        <Route path="marcas" element={<Marcas />} />
        <Route path="marcas/nuevo" element={<MarcasForm />} />
        <Route path="marcas/editar/:id" element={<MarcasForm />} />

        {/* Proveedores */}
        <Route path="proveedores" element={<Proveedores />} />
        <Route path="proveedores/nuevo" element={<ProveedoresForm />} />
        <Route path="proveedores/editar/:id" element={<ProveedoresForm />} />

        {/* Ventas */}
        <Route path="ventas" element={<Ventas />} />
        <Route path="ventas/nuevo" element={<VentaForm />} />
        <Route path="ventas/editar/:id" element={<VentaForm />} />
        <Route path="ventas/ver/:id" element={<VentaDetalle />} />

        {/* Órdenes de compra */}
        <Route path="ordenes_compra" element={<OrdenesCompra />} />
        <Route path="ordenes_compra/nuevo" element={<OrdenCompraForm />} />
        <Route path="ordenes_compra/editar/:id" element={<OrdenCompraForm />} />
        <Route path="ordenes_compra/detalle/:id" element={<OrdenCompraDetalle />} />

        {/* Transacciones */}
        <Route path="transacciones" element={<Transacciones />} />

        {/* Usuarios */}
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="usuarios/nuevo" element={<UsuarioForm />} />
        <Route path="usuarios/editar/:id" element={<UsuarioForm />} />

        {/* Cualquier ruta desconocida redirige a /productos */}
        <Route path="*" element={<Navigate to="productos" replace />} />
      </Route>

      {/* Si ninguna coincide, redirige a login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
