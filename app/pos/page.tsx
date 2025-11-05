// app/pos/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PaymentModal from '@/app/components/pos/PaymentModal';
import ReceiptModal from '@/app/components/pos/ReceiptModal';
import type { Producto, CartItem, VentaData, VentaParaRecibo } from '@/app/types/index';

export default function POSPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<CartItem[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notificacion, setNotificacion] = useState<string | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [ventaParaRecibo, setVentaParaRecibo] = useState<VentaParaRecibo | null>(null);

  const mostrarNotificacion = (mensaje: string) => {
    setNotificacion(mensaje);
    setTimeout(() => {
      setNotificacion(null);
    }, 3000);
  };

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const res = await fetch('/api/productos');
        const data = await res.json();
        setProductos(data);
      } catch (error) {
        console.error('Error cargando productos:', error);
        mostrarNotificacion('Error al cargar productos.');
      } finally {
        setCargando(false);
      }
    };
    cargarProductos();
  }, []);

  const agregarAlCarrito = (producto: Producto) => {
    if (producto.inventario <= 0) {
      mostrarNotificacion('Producto sin stock disponible');
      return;
    }

    setCarrito(prevCarrito => {
      const productoExistente = prevCarrito.find(item => item.id === producto.id);
      if (productoExistente) {
        if (productoExistente.cantidad >= producto.inventario) {
          mostrarNotificacion('No hay suficiente stock disponible');
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
        mostrarNotificacion('No hay suficiente stock disponible');
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

  const finalizarVenta = () => {
    if (carrito.length === 0) {
      mostrarNotificacion('El carrito está vacío.');
      return;
    }
    setIsModalOpen(true);
  };

  const handleVentaExitosa = async (ventaData: VentaData) => {
    mostrarNotificacion('Venta realizada con éxito!');

    setVentaParaRecibo({ venta: ventaData, items: carrito });

    try {
      const res = await fetch('/api/productos');
      const data = await res.json();
      setProductos(data);
    } catch (error) {
      mostrarNotificacion('Error al recargar productos, recarga la página.');
    }
  };

  const handleCloseReceipt = () => {
    setIsReceiptModalOpen(false);
    setVentaParaRecibo(null);
    limpiarCarrito();
  };

  useEffect(() => {
    if (ventaParaRecibo) {
      setIsReceiptModalOpen(true);
    }
  }, [ventaParaRecibo]);

  const totalCarrito = carrito.reduce((total, item) => total + item.precio * item.cantidad, 0);

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">

      {/* --- Contenedor de Notificación --- */}
      {notificacion && (
        <div className="fixed top-24 right-6 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in-out">
          {notificacion}
        </div>
      )}

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
                      className={`bg-gradient-to-br from-white to-gray-50 p-4 rounded-xl shadow-md cursor-pointer text-center hover:shadow-lg transition-all duration-300 border-2 ${producto.inventario <= 0
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
                      <div className={`text-xs font-medium px-2 py-1 rounded-full ${producto.inventario > 0
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

      {/* --- Renderizar el Modal --- */}
      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        total={totalCarrito}
        cartItems={carrito.map(item => ({
          productoId: item.id,
          cantidad: item.cantidad,
        }))}
        onVentaExitosa={handleVentaExitosa}
        setNotificacion={mostrarNotificacion}
      />

      {/* --- Renderizar el Modal de Recibo --- */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={handleCloseReceipt}
        ventaData={ventaParaRecibo?.venta}
        cartItems={ventaParaRecibo?.items}
      />
    </div>
  );
}
