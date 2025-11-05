// app/reportes/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface VentasPeriodo {
  totalIngresos: number;
  numeroDeVentas: number;
  periodo: string;
}

interface ProductoInventario {
  id: number;
  nombre: string;
  inventario: number;
}

interface ReporteGeneral {
  ventasPorPeriodo: VentasPeriodo;
  alertaInventario: ProductoInventario[];
}

interface RankingProducto {
  productoId: number;
  nombre: string;
  cantidadVendida: number;
  ingresoGenerado: number;
}

interface RankingData {
  rankingPorCantidad: RankingProducto[];
  rankingPorIngresos: RankingProducto[];
}

const StatCard = ({ title, value, colorClass, icon }: { title: string; value: string | number; colorClass: string; icon: string }) => (
  <div className={`p-6 rounded-2xl shadow-xl ${colorClass} transition-all duration-300 hover:shadow-2xl hover:scale-105`}>
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2 opacity-90">{title}</h3>
        <p className="text-4xl font-bold text-white">{value}</p>
      </div>
      <div className="text-3xl opacity-80">
        {icon}
      </div>
    </div>
  </div>
);

const RankingTable = ({ title, data, valueKey, valuePrefix = '', icon }: { title: string, data: RankingProducto[], valueKey: 'cantidadVendida' | 'ingresoGenerado', valuePrefix?: string, icon: string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-xl border border-purple-100 h-full">
    <div className="flex items-center gap-3 mb-6">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
        <span className="text-white font-bold text-lg">{icon}</span>
      </div>
      <h3 className="text-xl font-bold text-gray-800">{title}</h3>
    </div>
    <div className="space-y-4">
      {data.slice(0, 5).map((item, index) => (
        <div 
          key={item.productoId} 
          className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 hover:border-purple-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
              index === 0 ? 'bg-yellow-500' : 
              index === 1 ? 'bg-gray-400' : 
              index === 2 ? 'bg-orange-600' : 'bg-purple-400'
            }`}>
              {index + 1}
            </div>
            <span className="font-medium text-gray-800">{item.nombre}</span>
          </div>
          <span className="font-bold text-purple-600">
            {valuePrefix}{valueKey === 'ingresoGenerado' ? item[valueKey].toFixed(2) : item[valueKey]}
          </span>
        </div>
      ))}
      
      {data.length === 0 && (
        <div className="text-center py-6">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-gray-500">No hay datos disponibles</p>
        </div>
      )}
    </div>
  </div>
);

export default function ReportesPage() {
  const [reporte, setReporte] = useState<ReporteGeneral | null>(null);
  const [ranking, setRanking] = useState<RankingData | null>(null);
  const [periodo, setPeriodo] = useState('dia'); 
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);
      try {
        const [resReporte, resRanking] = await Promise.all([
          fetch(`/api/reportes?periodo=${periodo}`),
          fetch('/api/reportes/mas-vendidos')
        ]);
        const dataReporte = await resReporte.json();
        const dataRanking = await resRanking.json();
        setReporte(dataReporte);
        setRanking(dataRanking);
      } catch (error) {
        console.error("Error al cargar los reportes:", error);
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, [periodo]);

  const getPeriodoTexto = () => {
    switch (periodo) {
      case 'dia': return 'hoy';
      case 'semana': return 'esta semana';
      case 'mes': return 'este mes';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header del Dashboard */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard de Reportes</h1>
            <p className="text-gray-600">
              Resumen completo del desempeño de tu pastelería {getPeriodoTexto()}
            </p>
          </div>
          
          {/* Selector de Período */}
          <div className="bg-white p-1 rounded-xl shadow-lg border border-purple-100">
            <div className="flex gap-1">
              {[
                { key: 'dia', label: 'Hoy', icon: '📅' },
                { key: 'semana', label: 'Semana', icon: '📆' },
                { key: 'mes', label: 'Mes', icon: '🗓️' }
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setPeriodo(item.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                    periodo === item.key 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg' 
                      : 'text-gray-600 hover:text-purple-600'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {cargando ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Cargando reportes...</p>
            </div>
          </div>
        ) : reporte && ranking ? (
          <div className="space-y-8">
            {/* Sección de Métricas Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard 
                title={`Ingresos Totales`}
                value={`Bs. ${reporte.ventasPorPeriodo.totalIngresos.toFixed(2)}`}
                colorClass="bg-gradient-to-r from-green-500 to-emerald-600"
                icon="💰"
              />
              <StatCard 
                title={`Total de Ventas`}
                value={reporte.ventasPorPeriodo.numeroDeVentas}
                colorClass="bg-gradient-to-r from-blue-500 to-cyan-600"
                icon="🛒"
              />
              <StatCard 
                title={`Período`}
                value={reporte.ventasPorPeriodo.periodo}
                colorClass="bg-gradient-to-r from-purple-500 to-pink-500"
                icon="⏱️"
              />
            </div>

            {/* Sección de Rankings y Alertas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <RankingTable 
                title="Top 5 Más Vendidos" 
                data={ranking.rankingPorCantidad} 
                valueKey="cantidadVendida" 
                icon="🏆"
              />
              <RankingTable 
                title="Top 5 Más Rentables" 
                data={ranking.rankingPorIngresos} 
                valueKey="ingresoGenerado" 
                valuePrefix="Bs. " 
                icon="💎"
              />
              
              {/* Alertas de Inventario Bajo */}
              <div className="bg-white p-6 rounded-2xl shadow-xl border border-red-100 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-r from-red-500 to-orange-500 p-2 rounded-lg">
                    <span className="text-white font-bold text-lg">🚨</span>
                  </div>
                  <h3 className="text-xl font-bold text-red-600">Alerta: Inventario Bajo</h3>
                </div>
                
                {reporte.alertaInventario.length > 0 ? (
                  <div className="space-y-3">
                    {reporte.alertaInventario.map(item => (
                      <div 
                        key={item.id} 
                        className="flex justify-between items-center p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200 hover:border-red-300 transition-colors"
                      >
                        <span className="font-medium text-gray-800">{item.nombre}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-red-500">{item.inventario} uds.</span>
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">🎉</div>
                    <p className="text-green-600 font-semibold mb-1">¡Todo en orden!</p>
                    <p className="text-gray-500 text-sm">No hay productos con bajo inventario</p>
                  </div>
                )}
              </div>
            </div>

            {/* Información Adicional */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">💡</span>
                <h3 className="text-xl font-bold">Información del Período</h3>
              </div>
              <p className="opacity-90">
                Los datos mostrados corresponden a las ventas de {getPeriodoTexto()}. 
                Las alertas de inventario se actualizan en tiempo real según el stock disponible.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">😕</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No se pudieron cargar los datos</h3>
            <p className="text-gray-600 mb-4">Hubo un problema al cargar los reportes. Por favor, intenta nuevamente.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-pink-600 transition-all duration-300"
            >
              Reintentar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}