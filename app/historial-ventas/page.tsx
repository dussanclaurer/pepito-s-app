// app/historial-ventas/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { VentaCompleta, VentaProductoDetalle } from '@/app/types';

type Periodo = 'dia' | 'semana' | 'mes';

export default function HistorialVentasPage() {
  const router = useRouter();
  const [ventas, setVentas] = useState<VentaCompleta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [periodoActivo, setPeriodoActivo] = useState<Periodo>('dia');
  const [ventaSeleccionada, setVentaSeleccionada] = useState<VentaCompleta | null>(null);

  const cargarHistorial = async (periodo: Periodo) => {
    setCargando(true);
    setPeriodoActivo(periodo);
    try {
      const res = await fetch(`/api/historial-ventas?periodo=${periodo}`);
      if (!res.ok) throw new Error('Error al cargar el historial');
      const data: VentaCompleta[] = await res.json();
      setVentas(data);
    } catch (error) {
      console.error(error);
      alert('Error al cargar el historial de ventas.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHistorial('dia'); 
  }, []);

  const formatFecha = (isoString: string) => {
    const fecha = new Date(isoString);
    return fecha.toLocaleString('es-BO', {
      timeZone: 'America/La_Paz',
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">

      {/* --- Contenido Principal --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-purple-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Historial de Ventas</h2>
            {/* --- Botones de Filtro --- */}
            <div className="flex space-x-2 bg-purple-50 p-1 rounded-lg">
              <button
                onClick={() => cargarHistorial('dia')}
                className={`px-4 py-2 rounded-md font-semibold ${periodoActivo === 'dia' ? 'bg-purple-600 text-white shadow-md' : 'text-purple-700 hover:bg-purple-100'}`}
              >
                Hoy
              </button>
              <button
                onClick={() => cargarHistorial('semana')}
                className={`px-4 py-2 rounded-md font-semibold ${periodoActivo === 'semana' ? 'bg-purple-600 text-white shadow-md' : 'text-purple-700 hover:bg-purple-100'}`}
              >
                Semana
              </button>
              <button
                onClick={() => cargarHistorial('mes')}
                className={`px-4 py-2 rounded-md font-semibold ${periodoActivo === 'mes' ? 'bg-purple-600 text-white shadow-md' : 'text-purple-700 hover:bg-purple-100'}`}
              >
                Mes
              </button>
            </div>
          </div>
          
          {/* --- Lista de Ventas --- */}
          {cargando ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : ventas.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-gray-500 text-lg">No se encontraron ventas</p>
              <p className="text-gray-400 text-sm mt-2">
                No hay ventas registradas para el período seleccionado.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
              {ventas.map(venta => (
                <div key={venta.id} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100 shadow-md">
                  {/* Resumen de la Venta */}
                  <div 
                    className="flex justify-between items-center cursor-pointer" 
                    onClick={() => setVentaSeleccionada(ventaSeleccionada?.id === venta.id ? null : venta)}
                  >
                    <div>
                      <span className="text-sm font-semibold text-purple-700">
                        ID: #{venta.id.toString().padStart(6, '0')}
                      </span>
                      <p className="text-lg font-bold text-gray-800">
                        Total: Bs. {venta.total.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-600">{formatFecha(venta.creadoEn)}</span>
                      <span 
                        className={`text-xs font-bold px-2 py-1 rounded-full ml-2 ${
                          venta.metodoPago === 'EFECTIVO' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {venta.metodoPago}
                      </span>
                    </div>
                  </div>

                  {/* Detalles (Expandible) */}
                  {ventaSeleccionada?.id === venta.id && (
                    <div className="mt-4 pt-4 border-t border-purple-200 animate-fade-in">
                      <h4 className="font-semibold text-gray-700 mb-2">Detalles de la Venta:</h4>
                      <ul className="space-y-1 text-sm list-disc list-inside bg-white p-3 rounded-md border">
                        {venta.productosVendidos.map(item => (
                          <li key={item.id}>
                            {item.cantidad} x {item.producto.nombre} 
                            <span className="text-gray-500"> (Bs. {item.precioUnitario.toFixed(2)} c/u)</span>
                          </li>
                        ))}
                      </ul>
                      <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                        <div className="bg-white p-2 rounded-lg border">
                          <span className="text-gray-500 block">Monto Recibido</span>
                          <span className="font-semibold">Bs. {venta.montoRecibido.toFixed(2)}</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border">
                          <span className="text-gray-500 block">Cambio Entregado</span>
                          <span className="font-semibold">Bs. {venta.cambio.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}