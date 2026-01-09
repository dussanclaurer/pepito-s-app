// app/inventario/page.tsx

'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Tag, Cake, ClipboardList, Package, TrendingUp, Pencil, Trash2 } from 'lucide-react';

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
  cantidadVendida: number;
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
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoAEditar, setProductoAEditar] = useState<Producto | null>(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState<number | 'todas'>('todas');
  const router = useRouter();

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [resCategorias, resProductos] = await Promise.all([
        fetch('/api/categorias'),
        fetch('/api/productos')
      ]);
      const dataCategorias = await resCategorias.json();
      const dataProductos = await resProductos.json();
      setCategorias(dataCategorias);
      setProductos(dataProductos);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleCategoriaSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!nombreNuevaCategoria.trim()) return;
    
    try {
      await fetch('/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombreNuevaCategoria }),
      });
      setNombreNuevaCategoria('');
      cargarDatos();
    } catch (error) {
      alert('Error al crear categoría');
    }
  };

  const handleProductoSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!nuevoProducto.nombre.trim() || !nuevoProducto.precio || !nuevoProducto.categoriaId) return;
    
    try {
      await fetch('/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nuevoProducto,
          precio: parseFloat(nuevoProducto.precio as string),
          inventario: parseInt(nuevoProducto.inventario as string) || 0,
        }),
      });
      setNuevoProducto(estadoInicialProducto);
      cargarDatos();
    } catch (error) {
      alert('Error al crear producto');
    }
  };

  const handleEditClick = (producto: Producto) => {
    setProductoAEditar(producto);
    setModalAbierto(true);
  };

  const handleDeleteClick = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await fetch(`/api/productos/${id}`, {
          method: 'DELETE',
        });
        cargarDatos();
      } catch (error) {
        alert('Error al eliminar producto');
      }
    }
  };

  const handleUpdateSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!productoAEditar) return;

    try {
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
    } catch (error) {
      alert('Error al actualizar producto');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (modalAbierto && productoAEditar) {
      setProductoAEditar({ 
        ...productoAEditar, 
        [name]: name === 'precio' || name === 'inventario' ? parseFloat(value) || 0 : value 
      });
    } else {
      setNuevoProducto(prevState => ({ ...prevState, [name]: value }));
    }
  };

  // Filtrar productos por categoría
  const productosFiltrados = categoriaFiltro === 'todas' 
    ? productos 
    : productos.filter(p => p.categoriaId === categoriaFiltro);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Columna de Formularios */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Formulario de Categorías */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                  <Tag className="w-5 h-5" />
                </span>
                Nueva Categoría
              </h2>
              <form onSubmit={handleCategoriaSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={nombreNuevaCategoria}
                    onChange={(e) => setNombreNuevaCategoria(e.target.value)}
                    placeholder="Nombre de la categoría"
                    className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-red-500 text-white font-bold py-3 rounded-xl hover:from-blue-700 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                  disabled={!nombreNuevaCategoria.trim()}
                >
                  Guardar Categoría
                </button>
              </form>
            </div>

            {/* Formulario de Productos */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="bg-green-100 text-green-600 p-2 rounded-lg">
                  <Cake className="w-5 h-5" />
                </span>
                Nuevo Producto
              </h2>
              <form onSubmit={handleProductoSubmit} className="space-y-4">
                <input 
                  name="nombre" 
                  value={nuevoProducto.nombre} 
                  onChange={handleInputChange} 
                  type="text" 
                  placeholder="Nombre del producto" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                />
                <input 
                  name="precio" 
                  value={nuevoProducto.precio} 
                  onChange={handleInputChange} 
                  type="number" 
                  step="0.01"
                  placeholder="Precio (Bs.)" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                />
                <input 
                  name="inventario" 
                  value={nuevoProducto.inventario} 
                  onChange={handleInputChange} 
                  type="number" 
                  placeholder="Inventario inicial" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                />
                <select 
                  name="categoriaId" 
                  value={nuevoProducto.categoriaId} 
                  onChange={handleInputChange} 
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                >
                  <option value="" disabled>Selecciona una categoría</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
                <button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold py-3 rounded-xl hover:from-green-700 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                  disabled={!nuevoProducto.nombre.trim() || !nuevoProducto.precio || !nuevoProducto.categoriaId}
                >
                  Guardar Producto
                </button>
              </form>
            </div>
          </div>

          {/* Tabla de Productos */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-blue-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                    <ClipboardList className="w-5 h-5" />
                  </span>
                  Lista de Productos
                </h2>
                <div className="flex items-center gap-4">
                  <select 
                    value={categoriaFiltro}
                    onChange={(e) => setCategoriaFiltro(e.target.value === 'todas' ? 'todas' : parseInt(e.target.value))}
                    className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                  >
                    <option value="todas">Todas las categorías</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                  <div className="text-sm text-gray-500">
                    {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {cargando ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden">
                      <table className="min-w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-50 to-red-50 border-b border-blue-200">
                        <th className="p-4 font-semibold text-gray-700 text-left">Producto</th>
                        <th className="p-4 font-semibold text-gray-700 text-left">Categoría</th>
                        <th className="p-4 font-semibold text-gray-700 text-left">Precio</th>
                        <th className="p-4 font-semibold text-gray-700 text-left">Stock</th>
                        <th className="p-4 font-semibold text-gray-700 text-left">Vendidos Hoy</th>
                        <th className="p-4 font-semibold text-gray-700 text-left rounded-r-xl">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productosFiltrados.map((producto, index) => (
                        <tr 
                          key={producto.id} 
                          className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                            index === productos.length - 1 ? 'border-b-0' : ''
                          }`}
                        >
                          <td className="p-4">
                            <div className="font-semibold text-gray-800">{producto.nombre}</div>
                          </td>
                          <td className="p-4">
                            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                              {producto.categoria.nombre}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-green-600">
                              Bs. {producto.precio.toFixed(2)}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                                producto.inventario > 10 
                                  ? 'bg-green-100 text-green-800'
                                  : producto.inventario > 0
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {producto.inventario} unidades
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-semibold text-gray-700">
                                {producto.cantidadVendida} uds.
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleEditClick(producto)}
                                className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-all duration-200 text-sm font-medium flex items-center gap-1"
                              >
                                <Pencil className="w-3 h-3" />
                                Editar
                              </button>
                              <button 
                                onClick={() => handleDeleteClick(producto.id)}
                                className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-all duration-200 text-sm font-medium flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {productosFiltrados.length === 0 && (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500 text-lg">
                        {categoriaFiltro === 'todas' ? 'No hay productos registrados' : 'No hay productos en esta categoría'}
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        {categoriaFiltro === 'todas' 
                          ? 'Agrega tu primer producto usando el formulario'
                          : 'Prueba con otra categoría o agrega nuevos productos'
                        }
                      </p>
                    </div>
                  )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Edición */}
      {modalAbierto && productoAEditar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="backdrop-blur-xl bg-white/95 rounded-2xl shadow-2xl w-full max-w-md border border-white/20 transform transition-all">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                  <Pencil className="w-5 h-5" />
                </span>
                Editar Producto
              </h2>
            </div>
            
            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                <input 
                  name="nombre" 
                  value={productoAEditar.nombre} 
                  onChange={handleInputChange} 
                  type="text" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Precio (Bs.)</label>
                <input 
                  name="precio" 
                  value={productoAEditar.precio} 
                  onChange={handleInputChange} 
                  type="number" 
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Inventario</label>
                <input 
                  name="inventario" 
                  value={productoAEditar.inventario} 
                  onChange={handleInputChange} 
                  type="number" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                <select 
                  name="categoriaId" 
                  value={productoAEditar.categoriaId} 
                  onChange={handleInputChange} 
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                >
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setModalAbierto(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-red-500 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-red-600 transition-all duration-300 shadow-lg"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
