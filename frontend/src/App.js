// src/App.js
import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import { AuthContext } from './contexts/AuthContext';

// Providers y overlay
import { LoadingProvider } from './contexts/LoadingContext';
import LoaderOverlay from './components/LoaderOverlay';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { ToastProvider } from './contexts/ToastContext';

// Páginas...
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
import OrdenesCompra from './pages/OrdenesCompras'; // verifica nombre/archivo
import OrdenCompraForm from './pages/OrdenCompraForm';
import OrdenCompraDetalle from './pages/OrdenCompraDetalle';
import Usuarios from './pages/Usuarios';
import UsuarioForm from './pages/UsuarioForm';
import Transportistas from './pages/Transportistas';
import Reportes from './pages/Reportes';

function PrivateRoute({ children }) {
  const { token } = useContext(AuthContext);
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <LoadingProvider>
      <ToastProvider>
        <ConfirmProvider>
          <Routes>
            {/* Pública */}
            <Route path="/login" element={<Login />} />

            {/* Protegidas */}
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Navigate to="productos" replace />} />
              <Route path="transportistas" element={<Transportistas />} />
              <Route path="reportes" element={<Reportes />} />

              <Route path="productos" element={<Productos />} />
              <Route path="productos/nuevo" element={<ProductoForm />} />
              <Route path="productos/editar/:id" element={<ProductoForm />} />

              <Route path="clientes" element={<Clientes />} />
              <Route path="clientes/nuevo" element={<ClienteForm />} />
              <Route path="clientes/editar/:id" element={<ClienteForm />} />

              <Route path="categorias" element={<Categorias />} />
              <Route path="categorias/nuevo" element={<CategoriaForm />} />
              <Route path="categorias/editar/:id" element={<CategoriaForm />} />

              <Route path="marcas" element={<Marcas />} />
              <Route path="marcas/nuevo" element={<MarcasForm />} />
              <Route path="marcas/editar/:id" element={<MarcasForm />} />

              <Route path="proveedores" element={<Proveedores />} />
              <Route path="proveedores/nuevo" element={<ProveedoresForm />} />
              <Route path="proveedores/editar/:id" element={<ProveedoresForm />} />

              <Route path="ventas" element={<Ventas />} />
              <Route path="ventas/nuevo" element={<VentaForm />} />
              <Route path="ventas/editar/:id" element={<VentaForm />} />
              <Route path="ventas/ver/:id" element={<VentaDetalle />} />

              <Route path="ordenes_compra" element={<OrdenesCompra />} />
              <Route path="ordenes_compra/nuevo" element={<OrdenCompraForm />} />
              <Route path="ordenes_compra/editar/:id" element={<OrdenCompraForm />} />
              <Route path="ordenes_compra/detalle/:id" element={<OrdenCompraDetalle />} />

              <Route path="transacciones" element={<Transacciones />} />

              <Route path="usuarios" element={<Usuarios />} />
              <Route path="usuarios/nuevo" element={<UsuarioForm />} />
              <Route path="usuarios/editar/:id" element={<UsuarioForm />} />

              <Route path="*" element={<Navigate to="productos" replace />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>

          {/* Overlay global (depende de LoadingProvider, ya está arriba) */}
          <LoaderOverlay />
        </ConfirmProvider>
      </ToastProvider>
    </LoadingProvider>
  );
}
