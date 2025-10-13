'use client';

import { useState, useEffect, FormEvent } from 'react';

interface Categoria {
  id: number;
  nombre: string;
}

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  inventario: number;
  categoriaId: number; 
  categoria: Categoria;
}

const estadoInicialProducto = {
  nombre: '',
  precio: '',
  inventario: '',
  categoriaId: '',
};

export default function InventarioPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [nombreNuevaCategoria, setNombreNuevaCategoria] = useState('');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [nuevoProducto, setNuevoProducto] = useState(estadoInicialProducto);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoAEditar, setProductoAEditar] = useState<Producto | null>(null);

  const cargarDatos = async () => {
    const [resCategorias, resProductos] = await Promise.all([
      fetch('/api/categorias'),
      fetch('/api/productos')
    ]);
    const dataCategorias = await resCategorias.json();
    const dataProductos = await resProductos.json();
    setCategorias(dataCategorias);
    setProductos(dataProductos);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleCategoriaSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await fetch('/api/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nombreNuevaCategoria }),
    });
    setNombreNuevaCategoria('');
    cargarDatos();
  };

  const handleProductoSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await fetch('/api/productos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoProducto),
    });
    setNuevoProducto(estadoInicialProducto);
    cargarDatos();
  };

  const handleEditClick = (producto: Producto) => {
    setProductoAEditar(producto);
    setModalAbierto(true);
  };

  const handleDeleteClick = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      await fetch(`/api/productos/${id}`, {
        method: 'DELETE',
      });
      cargarDatos(); 
    }
  };

  const handleUpdateSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!productoAEditar) return;

    await fetch(`/api/productos/${productoAEditar.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: productoAEditar.nombre,
        precio: productoAEditar.precio,
        inventario: productoAEditar.inventario,
        categoriaId: productoAEditar.categoriaId,
      }),
    });
    
    setModalAbierto(false);
    setProductoAEditar(null);
    cargarDatos();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (modalAbierto && productoAEditar) {
      setProductoAEditar({ ...productoAEditar, [name]: value });
    } else {
      setNuevoProducto(prevState => ({ ...prevState, [name]: value }));
    }
  };


  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">Gestión de Inventario</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna de Formularios */}
        <div className="lg:col-span-1 space-y-8">
          {/* Formulario de Categorías */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-slate-700 mb-4">Añadir Categoría</h2>
            <form onSubmit={handleCategoriaSubmit} className="space-y-3">
              <input
                type="text"
                value={nombreNuevaCategoria}
                onChange={(e) => setNombreNuevaCategoria(e.target.value)}
                placeholder="Nombre de la categoría"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                Guardar Categoría
              </button>
            </form>
          </div>

          {/* Formulario de Productos */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-slate-700 mb-4">Añadir Producto</h2>
            <form onSubmit={handleProductoSubmit} className="space-y-3">
              <input name="nombre" value={nuevoProducto.nombre} onChange={handleInputChange} type="text" placeholder="Nombre del producto" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input name="precio" value={nuevoProducto.precio} onChange={handleInputChange} type="number" placeholder="Precio" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input name="inventario" value={nuevoProducto.inventario} onChange={handleInputChange} type="number" placeholder="Inventario inicial" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <select name="categoriaId" value={nuevoProducto.categoriaId} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="" disabled>Selecciona una categoría</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
              <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                Guardar Producto
              </button>
            </form>
          </div>
        </div>

      {/* --- TABLA DE PRODUCTOS --- */}
      <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">Lista de Productos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 font-semibold text-slate-600">Nombre</th>
                  <th className="p-3 font-semibold text-slate-600">Categoría</th>
                  <th className="p-3 font-semibold text-slate-600">Precio</th>
                  <th className="p-3 font-semibold text-slate-600">Inventario</th>
                  <th className="p-3 font-semibold text-slate-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map(producto => (
                  <tr key={producto.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{producto.nombre}</td>
                    <td className="p-3">{producto.categoria.nombre}</td>
                    <td className="p-3">Bs. {producto.precio.toFixed(2)}</td>
                    <td className="p-3">{producto.inventario}</td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => handleEditClick(producto)} className="text-blue-600 hover:text-blue-800 font-semibold">Editar</button>
                      <button onClick={() => handleDeleteClick(producto.id)} className="text-red-600 hover:text-red-800 font-semibold">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* --- MODAL DE EDICIÓN --- */}
      {modalAbierto && productoAEditar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Editar Producto</h2>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <input name="nombre" value={productoAEditar.nombre} onChange={handleInputChange} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              <input name="precio" value={productoAEditar.precio} onChange={handleInputChange} type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              <input name="inventario" value={productoAEditar.inventario} onChange={handleInputChange} type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              <select name="categoriaId" value={productoAEditar.categoriaId} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
              <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={() => setModalAbierto(false)} className="bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-md hover:bg-gray-400">Cancelar</button>
                <button type="submit" className="bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-700">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}