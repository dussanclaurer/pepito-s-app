// app/components/pos/PaymentModal.tsx

'use client';

import { useState, useMemo, useEffect } from 'react';
import { MetodoPago } from '@prisma/client'; // Importamos el tipo

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  cartItems: { productoId: number; cantidad: number }[];
  onVentaExitosa: (ventaData: any) => void;
  setNotificacion: (msg: string) => void; // Para mostrar notificaciones de error
}

type EstadoVenta = 'idle' | 'loading' | 'error';

export default function PaymentModal({
  isOpen,
  onClose,
  total,
  cartItems,
  onVentaExitosa,
  setNotificacion,
}: PaymentModalProps) {
  const [metodo, setMetodo] = useState<MetodoPago>('EFECTIVO');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [estado, setEstado] = useState<EstadoVenta>('idle');

  useEffect(() => {
    if (isOpen) {
      setMetodo('EFECTIVO');
      setMontoRecibido('');
      setEstado('idle');
    }
  }, [isOpen]);

  const cambio = useMemo(() => {
    const monto = parseFloat(montoRecibido) || 0;
    if (metodo === 'EFECTIVO' && monto > 0) {
      return monto - total;
    }
    return 0;
  }, [montoRecibido, total, metodo]);

  const puedeConfirmar =
    metodo === 'QR' || (metodo === 'EFECTIVO' && cambio >= 0 && montoRecibido !== '');

  const handleConfirmarPago = async () => {
    setEstado('loading');

    const montoFinal = metodo === 'QR' ? total : parseFloat(montoRecibido);

    try {
      const body = {
        cartItems: cartItems,
        payment: {
          metodo: metodo,
          montoRecibido: montoFinal,
        },
      };

      const response = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        onVentaExitosa(data); 
        onClose(); 
      } else {
        const errorData = await response.json();
        setNotificacion(`Error: ${errorData.message}`);
        setEstado('error');
      }
    } catch (error) {
      console.error(error);
      setNotificacion('Error de conexión al procesar el pago.');
      setEstado('error');
    } finally {
      if (estado !== 'error') {
        setEstado('idle');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4"
      onClick={onClose}
    >
      {/* Contenido del Modal */}
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
        onClick={e => e.stopPropagation()} 
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Procesar Pago</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Total a Pagar */}
          <div className="text-center">
            <p className="text-lg text-gray-600">Total a Pagar:</p>
            <p className="text-5xl font-extrabold text-purple-600">
              Bs. {total.toFixed(2)}
            </p>
          </div>

          {/* Selector de Método de Pago */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setMetodo('EFECTIVO')}
              className={`py-4 rounded-xl text-lg font-semibold transition-all ${
                metodo === 'EFECTIVO'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💵 Efectivo
            </button>
            <button
              onClick={() => setMetodo('QR')}
              className={`py-4 rounded-xl text-lg font-semibold transition-all ${
                metodo === 'QR'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
               QR
            </button>
          </div>

          {/* Input de Monto (Solo para Efectivo) */}
          {metodo === 'EFECTIVO' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label
                  htmlFor="montoRecibido"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Monto Recibido
                </label>
                <input
                  type="number"
                  id="montoRecibido"
                  value={montoRecibido}
                  onChange={e => setMontoRecibido(e.target.value)}
                  placeholder="Ej: 100"
                  className="w-full text-center text-2xl p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              {cambio >= 0 && (
                <div className="text-center">
                  <p className="text-lg text-gray-600">Cambio a devolver:</p>
                  <p className="text-3xl font-bold text-green-600">
                    Bs. {cambio.toFixed(2)}
                  </p>
                </div>
              )}
              {cambio < 0 && (
                <div className="text-center">
                  <p className="text-lg font-medium text-red-600">
                    Faltan: Bs. {Math.abs(cambio).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="p-6 bg-gray-50 rounded-b-2xl grid grid-cols-2 gap-4">
          <button
            onClick={onClose}
            className="py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmarPago}
            disabled={!puedeConfirmar || estado === 'loading'}
            className="py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all disabled:from-gray-400 disabled:cursor-not-allowed shadow-lg disabled:shadow-none"
          >
            {estado === 'loading' ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
            ) : (
              'Confirmar Pago'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
