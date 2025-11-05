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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">

      {/* Contenido de la página */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* --- CONTROLES (NO SE IMPRIMEN) --- */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-purple-100 mb-8 print:hidden">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Cierre de Caja Diario</h2>
          <p className="text-gray-600 mb-6">
            Presiona el botón para generar el reporte de ventas del día de hoy.
            Esto te mostrará el total de ventas separado por método de pago.
          </p>
          <button
            onClick={generarReporte}
            disabled={cargando}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold py-4 rounded-xl hover:from-purple-700 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-wait"
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
          <div className="printable-area bg-white rounded-2xl shadow-xl p-8 border border-purple-100 print:shadow-none print:border-none print:p-2">
            
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 print:text-black">Reporte de Cierre de Caja</h2>
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
                  <span className="text-2xl font-bold text-purple-600 print:text-black">
                    Bs. {item.total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total General */}
            <div className="border-t-2 border-dashed border-gray-300 pt-6">
              <div className="flex justify-between items-center bg-purple-50 p-6 rounded-lg border border-purple-200 print:border-t-2 print:border-black print:rounded-none print:p-2 print:bg-white">
                <span className="text-xl font-bold text-gray-800 print:text-black">
                  Total General Vendido:
                </span>
                <span className="text-3xl font-extrabold text-purple-700 print:text-black">
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
