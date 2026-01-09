// app/cierre-caja/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ReporteCierre {
  totalesPorMetodo: {
    metodoPago: string;
    total: number;
  }[];
  totalGeneral: number;
  fechaReporte: string;
  desglose: {
    totalVentas: number;
    totalAnticipos: number;
  };
  usuario?: {
    nombre: string;
    rol: string;
  };
  totalDescuentos: number;
  productosVendidos: {
    nombre: string;
    cantidadVendida: number;
    ingresoGenerado: number;
  }[];
  totalUnidadesVendidas: number;
}

export default function CierreCajaPage() {
  const [reporte, setReporte] = useState<ReporteCierre | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const generarReporte = async () => {
    setCargando(true);
    setError(null);
    setReporte(null);
    try {
      const res = await fetch('/api/reportes/cierre-caja');
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Error al generar el reporte');
      }
      const data: ReporteCierre = await res.json();
      setReporte(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado');
      }
    } finally {
      setCargando(false);
    }
  };
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50">

      {/* Contenido de la página */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* --- CONTROLES (NO SE IMPRIMEN) --- */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100 mb-8 print:hidden">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Cierre de Caja Diario</h2>
          <p className="text-gray-600 mb-6">
            Presiona el botón para generar el reporte de ventas del día de hoy.
            Esto te mostrará el total de ventas separado por método de pago.
          </p>
          <button
            onClick={generarReporte}
            disabled={cargando}
            className="w-full bg-gradient-to-r from-blue-600 to-red-500 text-white font-bold py-4 rounded-xl hover:from-blue-700 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-wait"
          >
            {cargando ? 'Generando...' : 'Generar Cierre de Hoy'}
          </button>
          
          {/* Contenedor de Error */}
          {error && (
            <div className="mt-4 text-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* --- REPORTE (SÍ SE IMPRIME) --- */}
        {/* Usamos las mismas clases 'printable-area' que definimos en globals.css */}
        {reporte && (
          <div className="printable-area bg-white rounded-2xl shadow-xl p-8 border border-blue-100 print:shadow-none print:border-none print:p-2">
            
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 print:text-black">Reporte de Cierre de Caja</h2>
              {reporte.usuario && reporte.usuario.rol === 'CAJERO' && (
                <p className="text-md text-gray-700 print:text-black mt-1">
                  Usuario: <span className="font-semibold">{reporte.usuario.nombre}</span>
                </p>
              )}
              <p className="text-lg text-gray-700 print:text-black">
                Fecha: <span className="font-semibold">{reporte.fechaReporte}</span>
              </p>
            </div>

            {/* Totales por Método */}
            <div className="space-y-4 mb-8">
              {reporte.totalesPorMetodo.map((item) => (
                <div 
                  key={item.metodoPago} 
                  className="flex justify-between items-center bg-gray-50 p-6 rounded-lg border border-gray-200 print:border-b print:border-black print:rounded-none print:p-2 print:bg-white"
                >
                  <span className="text-lg font-medium text-gray-600 print:text-black">
                    Total en {item.metodoPago === 'EFECTIVO' ? 'Efectivo' : 'QR'}:
                  </span>
                  <span className="text-2xl font-bold text-blue-600 print:text-black">
                    Bs. {item.total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Desglose de Totales */}
            {reporte.desglose && (
              <div className="border-t-2 border-dashed border-gray-300 pt-6 mb-6">
                <div className="space-y-3 text-gray-700 print:text-black">
                  <div className="flex justify-between">
                    <span>Total Ventas Regulares:</span>
                    <span className="font-medium">Bs. {reporte.desglose.totalVentas.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Anticipos (Pedidos):</span>
                    <span className="font-medium">Bs. {reporte.desglose.totalAnticipos.toFixed(2)}</span>
                  </div>
                  {/* Mostrar descuentos si hay alguno */}
                  {reporte.totalDescuentos > 0 && (
                    <div className="flex justify-between text-red-600 print:text-black">
                      <span>💸 Total Descuentos Aplicados:</span>
                      <span className="font-medium">- Bs. {reporte.totalDescuentos.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Productos Vendidos Hoy */}
            {reporte.productosVendidos && reporte.productosVendidos.length > 0 && (
              <div className="border-t-2 border-dashed border-gray-300 pt-6 mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 print:text-black flex items-center gap-2">
                  <span>📊</span> Productos Vendidos Hoy
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 print:bg-white border-b border-gray-200">
                        <th className="p-2 text-left font-semibold text-gray-700 print:text-black">Producto</th>
                        <th className="p-2 text-right font-semibold text-gray-700 print:text-black">Cantidad</th>
                        <th className="p-2 text-right font-semibold text-gray-700 print:text-black">Ingreso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reporte.productosVendidos.map((producto, index) => (
                        <tr key={index} className="border-b border-gray-100 print:border-gray-400">
                          <td className="p-2 text-gray-800 print:text-black">{producto.nombre}</td>
                          <td className="p-2 text-right text-gray-700 print:text-black">{producto.cantidadVendida} uds.</td>
                          <td className="p-2 text-right font-medium text-green-600 print:text-black">Bs. {producto.ingresoGenerado.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-blue-50 print:bg-white border-t-2 border-gray-300">
                        <td className="p-2 font-bold text-gray-800 print:text-black">Total</td>
                        <td className="p-2 text-right font-bold text-blue-600 print:text-black">{reporte.totalUnidadesVendidas} uds.</td>
                        <td className="p-2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Total General */}
            <div className="border-t-2 border-dashed border-gray-300 pt-6">
              <div className="flex justify-between items-center bg-blue-50 p-6 rounded-lg border border-blue-200 print:border-t-2 print:border-black print:rounded-none print:p-2 print:bg-white">
                <span className="text-xl font-bold text-gray-800 print:text-black">
                  Total General Vendido:
                </span>
                <span className="text-3xl font-extrabold text-blue-700 print:text-black">
                  Bs. {reporte.totalGeneral.toFixed(2)}
                </span>
              </div>
            </div>
            
            {/* Botón de Imprimir (No se imprime) */}
            <div className="mt-8 text-center print:hidden">
              <button
                onClick={handlePrint}
                className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition-all shadow-lg"
              >
                Imprimir Reporte
              </button>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}

