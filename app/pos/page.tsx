// app/pos/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  inventario: number;
}

interface CartItem extends Producto {
  cantidad: number;
}

export default function POSPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<CartItem[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const res = await fetch('/api/productos');
        const data = await res.json();
        setProductos(data);
      } catch (error) {
        console.error('Error cargando productos:', error);
      } finally {
        setCargando(false);
      }
    };
    cargarProductos();
  }, []);

  const agregarAlCarrito = (producto: Producto) => {
    if (producto.inventario <= 0) {
      alert('Producto sin stock disponible');
      return;
    }

    setCarrito(prevCarrito => {
      const productoExistente = prevCarrito.find(item => item.id === producto.id);
      if (productoExistente) {
        if (productoExistente.cantidad >= producto.inventario) {
          alert('No hay suficiente stock disponible');
          return prevCarrito;
        }
        return prevCarrito.map(item =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      } else {
        return [...prevCarrito, { ...producto, cantidad: 1 }];
      }
    });
  };

  const actualizarCantidad = (productoId: number, cantidad: number) => {
    setCarrito(prevCarrito => {
      if (cantidad <= 0) {
        return prevCarrito.filter(item => item.id !== productoId);
      }
      
      const producto = productos.find(p => p.id === productoId);
      if (producto && cantidad > producto.inventario) {
        alert('No hay suficiente stock disponible');
        return prevCarrito.map(item =>
          item.id === productoId ? { ...item, cantidad: item.cantidad } : item
        );
      }
      
      return prevCarrito.map(item =>
        item.id === productoId ? { ...item, cantidad } : item
      );
    });
  };

  const limpiarCarrito = () => {
    setCarrito([]);
  };

  const finalizarVenta = async () => {
    if (carrito.length === 0) {
      alert('El carrito está vacío.');
      return;
    }

    try {
      const ventaItems = carrito.map(item => ({
        productoId: item.id,
        cantidad: item.cantidad,
      }));

      const response = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ventaItems),
      });

      if (response.ok) {
        alert('Venta realizada con éxito!');
        limpiarCarrito();
        // Recargar productos para actualizar stock
        const res = await fetch('/api/productos');
        const data = await res.json();
        setProductos(data);
      } else {
        const errorData = await response.json();
        alert(`Error al realizar la venta: ${errorData.message}`);
      }
    } catch (error) {
      alert('Error al conectar con el servidor');
    }
  };

  const totalCarrito = carrito.reduce((total, item) => total + item.precio * item.cantidad, 0);

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header con Navegación */}
      <header className="bg-white shadow-lg border-b border-purple-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-2 rounded-lg">
                <span className="text-white font-bold text-xl">🍰</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Pepito´s</h1>
            </div>
            
            <nav className="flex space-x-4">
              <button
                onClick={() => router.push('/pos')}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-md"
              >
                Punto de Venta
              </button>
              <button
                onClick={() => router.push('/inventario')}
                className="bg-white text-purple-600 border border-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
              >
                Inventario
              </button>
              <button
                onClick={() => router.push('/reportes')}
                className="bg-white text-purple-600 border border-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
              >
                Reportes
              </button>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna de Productos (Catálogo) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-purple-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Catálogo de Productos</h2>
                <div className="relative w-64">
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar producto..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    🔍
                  </div>
                </div>
              </div>

              {cargando ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[70vh] overflow-y-auto pr-2">
                  {productosFiltrados.map(producto => (
                    <div
                      key={producto.id}
                      onClick={() => agregarAlCarrito(producto)}
                      className={`bg-gradient-to-br from-white to-gray-50 p-4 rounded-xl shadow-md cursor-pointer text-center hover:shadow-lg transition-all duration-300 border-2 ${
                        producto.inventario <= 0 
                          ? 'border-red-200 opacity-60' 
                          : 'border-purple-100 hover:border-purple-300'
                      }`}
                    >
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3 text-white text-lg">
                        🍰
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">
                        {producto.nombre}
                      </h3>
                      <p className="text-lg font-bold text-purple-600 mb-1">
                        Bs. {producto.precio.toFixed(2)}
                      </p>
                      <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                        producto.inventario > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {producto.inventario > 0 ? `${producto.inventario} en stock` : 'Sin stock'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Columna del Carrito */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-purple-100 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Pedido Actual</h2>
                {carrito.length > 0 && (
                  <button
                    onClick={limpiarCarrito}
                    className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              <div className="flex-grow overflow-y-auto mb-4 pr-2">
                {carrito.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🛒</div>
                    <p className="text-gray-500 text-lg">El carrito está vacío</p>
                    <p className="text-gray-400 text-sm mt-2">
                      Agrega productos desde el catálogo
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {carrito.map(item => (
                      <div 
                        key={item.id} 
                        className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100 hover:border-purple-200 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">{item.nombre}</h3>
                            <p className="text-sm text-gray-600">Bs. {item.precio.toFixed(2)} c/u</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-purple-600 text-lg">
                              Bs. {(item.precio * item.cantidad).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Cantidad:</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                              className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={item.cantidad}
                              onChange={(e) => actualizarCantidad(item.id, parseInt(e.target.value) || 0)}
                              className="w-16 text-center border border-gray-300 rounded-lg py-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              min="0"
                            />
                            <button
                              onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                              className="w-8 h-8 bg-purple-600 text-white rounded-lg flex items-center justify-center hover:bg-purple-700 transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold text-gray-700">Total:</span>
                  <span className="text-2xl font-bold text-purple-600">
                    Bs. {totalCarrito.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={finalizarVenta}
                  disabled={carrito.length === 0}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold py-4 rounded-xl hover:from-purple-700 hover:to-pink-600 transition-all duration-300 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:hover:transform-none"
                >
                  Finalizar Venta
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}