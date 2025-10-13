//app/pos/page.tsx

'use client';

import { useState, useEffect } from 'react';

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

  useEffect(() => {
    const cargarProductos = async () => {
      const res = await fetch('/api/productos');
      const data = await res.json();
      setProductos(data);
    };
    cargarProductos();
  }, []);

  const agregarAlCarrito = (producto: Producto) => {
    setCarrito(prevCarrito => {
      const productoExistente = prevCarrito.find(item => item.id === producto.id);
      if (productoExistente) {
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
        // Eliminar si la cantidad es 0 o menos
        return prevCarrito.filter(item => item.id !== productoId);
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
      // Opcional: recargar productos para ver stock actualizado
      // cargarProductos(); 
    } else {
      const errorData = await response.json();
      alert(`Error al realizar la venta: ${errorData.message}`);
    }
  };

  const totalCarrito = carrito.reduce((total, item) => total + item.precio * item.cantidad, 0);

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="grid grid-cols-12 gap-4 h-screen bg-gray-100">
      {/* Columna de Productos (Catálogo) */}
      <div className="col-span-7 p-4">
        <h1 className="text-2xl font-bold mb-4">Punto de Venta</h1>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar producto..."
          className="w-full px-4 py-2 mb-4 border rounded-lg"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto max-h-[85vh]">
          {productosFiltrados.map(producto => (
            <div
              key={producto.id}
              onClick={() => agregarAlCarrito(producto)}
              className="bg-white p-4 rounded-lg shadow cursor-pointer text-center hover:shadow-lg transition-shadow"
            >
              <h2 className="font-semibold">{producto.nombre}</h2>
              <p className="text-gray-600">Bs. {producto.precio.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Columna del Carrito */}
      <div className="col-span-5 bg-white p-4 flex flex-col h-screen">
        <h2 className="text-xl font-bold mb-4">Pedido Actual</h2>
        <div className="flex-grow overflow-y-auto">
          {carrito.length === 0 ? (
            <p className="text-gray-500">El carrito está vacío.</p>
          ) : (
            carrito.map(item => (
              <div key={item.id} className="flex justify-between items-center mb-2 p-2 border-b">
                <div>
                  <p className="font-semibold">{item.nombre}</p>
                  <p className="text-sm text-gray-500">Bs. {item.precio.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={item.cantidad}
                    onChange={(e) => actualizarCantidad(item.id, parseInt(e.target.value))}
                    className="w-16 text-center border rounded"
                    min="0"
                  />
                  <span>Bs. {(item.precio * item.cantidad).toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between font-bold text-xl mb-4">
            <span>Total:</span>
            <span>Bs. {totalCarrito.toFixed(2)}</span>
          </div>
          <button
            onClick={finalizarVenta}
            className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
            disabled={carrito.length === 0}
          >
            Finalizar Venta
          </button>
        </div>
      </div>
    </div>
  );
}