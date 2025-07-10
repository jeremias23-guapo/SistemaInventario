import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Productos from './pages/Productos';
import ProductoForm from './pages/ProductoForm';

import Ventas from './pages/Ventas';
import VentaForm from './pages/VentaForm';
import VentaDetalle from './pages/VentaDetalle';
import Categorias from './pages/Categorias';
import CategoriaForm from './pages/CategoriasForm';
import Marcas from './pages/Marcas';
import MarcasForm from './pages/MarcasForm';
import Proveedores from './pages/Proveedores';
import ProveedoresForm from './pages/ProveedoresForm';
import Transacciones    from './pages/Transacciones';
import OrdenesCompra       from './pages/OrdenesCompras';
import OrdenCompraForm     from './pages/OrdenCompraForm';
import OrdenCompraDetalle  from './pages/OrdenCompraDetalle';
import Clientes from './pages/Clientes';
import ClienteForm from './pages/ClienteForm';
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>  
        {/* Productos */}
        <Route index element={<Navigate to="/productos" replace />} />
        <Route path="productos" element={<Productos />} />
        <Route path="productos/nuevo" element={<ProductoForm />} />
        <Route path="productos/editar/:id" element={<ProductoForm />} />

        
          <Route path="clientes" element={<Clientes />} />
          <Route path="clientes/nuevo" element={<ClienteForm />} />
          <Route path="clientes/editar/:id" element={<ClienteForm />} />

          {/* … resto de rutas … */}
        {/* Categorías y Subcategorías */}
        <Route path="categorias" element={<Categorias />} />
        <Route path="categorias/nuevo" element={<CategoriaForm />} />
        <Route path="categorias/editar/:id" element={<CategoriaForm />} />
 {/* Marcas */}
      <Route path="marcas"            element={<Marcas />} />
      <Route path="marcas/nuevo"      element={<MarcasForm />} />
      <Route path="marcas/editar/:id" element={<MarcasForm />} />

        {/* Ventas */}
        <Route path="ventas" element={<Ventas />} />
        <Route path="ventas/nuevo" element={<VentaForm />} />
        <Route path="ventas/editar/:id" element={<VentaForm />} />
       {/* Ver detalle de venta (solo lectura) */}
        <Route path="ventas/ver/:id" element={<VentaDetalle/>} />
        {/* Transacciones */}
        <Route path="transacciones" element={<Transacciones />} />

         {/* Proveedores */}
        <Route path="proveedores" element={<Proveedores />} />
        <Route path="proveedores/nuevo" element={<ProveedoresForm />} />
        <Route path="proveedores/editar/:id" element={<ProveedoresForm />} />
        
        <Route path="/ordenes_compra"             element={<OrdenesCompra />} />
        <Route path="/ordenes_compra/nuevo"       element={<OrdenCompraForm />} />
        <Route path="/ordenes_compra/editar/:id"  element={<OrdenCompraForm />} />
        <Route path="/ordenes_compra/detalle/:id" element={<OrdenCompraDetalle />} />
    {/* ... otras rutas ... */}
                <Route path="/transacciones" element={<Transacciones />} />
      {/* Ya no hay rutas a /transacciones/nuevo ni /transacciones/editar/:id */}
            {/* Redirigir rutas desconocidas */}
            <Route path="*" element={<Navigate to="/productos" replace />} />
          </Route>
        </Routes>
  );
}
