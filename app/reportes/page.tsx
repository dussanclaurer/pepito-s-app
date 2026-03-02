// app/reportes/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface VentasPeriodo {
  totalIngresos: number;
  numeroDeVentas: number;
  periodo: string;
  offset: number;
  fechaInicioLabel: string;
  fechaFinLabel: string | null;
  fechaInicioISO: string;
  fechaFinISO: string;
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

const StatCard = ({
  title,
  value,
  colorClass,
  icon,
}: {
  title: string;
  value: string | number;
  colorClass: string;
  icon: string;
}) => (
  <div
    className={`p-6 rounded-2xl shadow-xl ${colorClass} transition-all duration-300 hover:shadow-2xl hover:scale-105`}
  >
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2 opacity-90">
          {title}
        </h3>
        <p className="text-4xl font-bold text-white">{value}</p>
      </div>
      <div className="text-3xl opacity-80">{icon}</div>
    </div>
  </div>
);

const RankingTable = ({
  title,
  data,
  valueKey,
  valuePrefix = "",
  icon,
}: {
  title: string;
  data: RankingProducto[];
  valueKey: "cantidadVendida" | "ingresoGenerado";
  valuePrefix?: string;
  icon: string;
}) => (
  <div className="bg-white p-6 rounded-2xl shadow-xl border border-blue-100 h-full">
    <div className="flex items-center gap-3 mb-6">
      <div className="bg-gradient-to-r from-blue-500 to-red-500 p-2 rounded-lg">
        <span className="text-white font-bold text-lg">{icon}</span>
      </div>
      <h3 className="text-xl font-bold text-gray-800">{title}</h3>
    </div>
    <div className="space-y-4">
      {data.slice(0, 5).map((item, index) => (
        <div
          key={item.productoId}
          className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-red-50 rounded-xl border border-blue-100 hover:border-blue-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                index === 0
                  ? "bg-yellow-500"
                  : index === 1
                    ? "bg-gray-400"
                    : index === 2
                      ? "bg-orange-600"
                      : "bg-blue-400"
              }`}
            >
              {index + 1}
            </div>
            <span className="font-medium text-gray-800">{item.nombre}</span>
          </div>
          <span className="font-bold text-blue-600">
            {valuePrefix}
            {valueKey === "ingresoGenerado"
              ? item[valueKey].toFixed(2)
              : item[valueKey]}
          </span>
        </div>
      ))}

      {data.length === 0 && (
        <div className="text-center py-6">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-gray-500">No hay datos en este período</p>
        </div>
      )}
    </div>
  </div>
);

export default function ReportesPage() {
  const [reporte, setReporte] = useState<ReporteGeneral | null>(null);
  const [ranking, setRanking] = useState<RankingData | null>(null);
  const [periodo, setPeriodo] = useState("dia");
  const [offset, setOffset] = useState(0); // 0 = período actual, -1 = anterior, etc.
  const [cargando, setCargando] = useState(true);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const resReporte = await fetch(
        `/api/reportes?periodo=${periodo}&offset=${offset}`,
      );
      const dataReporte: ReporteGeneral = await resReporte.json();
      setReporte(dataReporte);

      // Pasar el mismo rango de fechas al ranking
      const { fechaInicioISO, fechaFinISO } = dataReporte.ventasPorPeriodo;
      const resRanking = await fetch(
        `/api/reportes/mas-vendidos?fechaInicio=${fechaInicioISO}&fechaFin=${fechaFinISO}`,
      );
      const dataRanking = await resRanking.json();
      setRanking(dataRanking);
    } catch (error) {
      console.error("Error al cargar los reportes:", error);
    } finally {
      setCargando(false);
    }
  }, [periodo, offset]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Al cambiar período, volver al período actual
  const handlePeriodoChange = (nuevoPeriodo: string) => {
    setPeriodo(nuevoPeriodo);
    setOffset(0);
  };

  const irAnterior = () => setOffset((o) => o - 1);
  const irSiguiente = () => setOffset((o) => Math.min(o + 1, 0));

  // Construye el label del período que se muestra
  const getPeriodoLabel = () => {
    if (!reporte) return "";
    const { fechaInicioLabel, fechaFinLabel } = reporte.ventasPorPeriodo;
    if (fechaFinLabel) {
      return `${fechaInicioLabel} – ${fechaFinLabel}`;
    }
    // Capitalizar primera letra
    return fechaInicioLabel.charAt(0).toUpperCase() + fechaInicioLabel.slice(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header del Dashboard */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Dashboard de Reportes
            </h1>
            <p className="text-gray-600">
              Resumen del desempeño de tu pastelería
            </p>
          </div>

          {/* Controles de período + navegación */}
          <div className="flex flex-col items-end gap-2">
            {/* Selector de tipo de período */}
            <div className="bg-white p-1 rounded-xl shadow-lg border border-blue-100">
              <div className="flex gap-1">
                {[
                  { key: "dia", label: "Día", icon: "📅" },
                  { key: "semana", label: "Semana", icon: "📆" },
                  { key: "mes", label: "Mes", icon: "🗓️" },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handlePeriodoChange(item.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                      periodo === item.key
                        ? "bg-gradient-to-r from-blue-600 to-red-500 text-white shadow-lg"
                        : "text-gray-600 hover:text-blue-600"
                    }`}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Navegación ◀ / label / ▶ */}
            <div className="flex items-center gap-2 bg-white rounded-xl shadow border border-blue-100 px-3 py-2">
              <button
                onClick={irAnterior}
                className="p-1 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                title="Período anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <span className="text-sm font-semibold text-gray-700 min-w-[200px] text-center">
                {cargando ? "..." : getPeriodoLabel()}
              </span>

              <button
                onClick={irSiguiente}
                disabled={offset >= 0}
                className="p-1 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Período siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {cargando ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Cargando reportes...</p>
            </div>
          </div>
        ) : reporte && ranking ? (
          <div className="space-y-8">
            {/* Sección de Métricas Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard
                title="Ingresos Totales"
                value={`Bs. ${reporte.ventasPorPeriodo.totalIngresos.toFixed(2)}`}
                colorClass="bg-gradient-to-r from-green-500 to-emerald-600"
                icon="💰"
              />
              <StatCard
                title="Total de Ventas"
                value={reporte.ventasPorPeriodo.numeroDeVentas}
                colorClass="bg-gradient-to-r from-blue-500 to-cyan-600"
                icon="🛒"
              />
              <StatCard
                title={
                  periodo === "dia"
                    ? "Fecha"
                    : periodo === "semana"
                      ? "Semana"
                      : "Mes"
                }
                value={
                  reporte.ventasPorPeriodo.fechaFinLabel
                    ? `${reporte.ventasPorPeriodo.fechaInicioLabel} – ${reporte.ventasPorPeriodo.fechaFinLabel}`
                    : reporte.ventasPorPeriodo.fechaInicioLabel
                }
                colorClass="bg-gradient-to-r from-blue-500 to-red-500"
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
                  <h3 className="text-xl font-bold text-red-600">
                    Alerta: Inventario Bajo
                  </h3>
                </div>

                {reporte.alertaInventario.length > 0 ? (
                  <div className="space-y-3">
                    {reporte.alertaInventario.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200 hover:border-red-300 transition-colors"
                      >
                        <span className="font-medium text-gray-800">
                          {item.nombre}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-red-500">
                            {item.inventario} uds.
                          </span>
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">🎉</div>
                    <p className="text-green-600 font-semibold mb-1">
                      ¡Todo en orden!
                    </p>
                    <p className="text-gray-500 text-sm">
                      No hay productos con bajo inventario
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Información Adicional */}
            <div className="bg-gradient-to-r from-blue-500 to-red-500 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">💡</span>
                <h3 className="text-xl font-bold">Información del Período</h3>
              </div>
              <p className="opacity-90">
                {offset === 0
                  ? `Mostrando datos del ${periodo === "dia" ? "día de hoy" : periodo === "semana" ? "semana actual (Lun–Dom)" : "mes actual"}.`
                  : `Mostrando datos de ${Math.abs(offset)} ${
                      periodo === "dia"
                        ? `día${Math.abs(offset) > 1 ? "s" : ""}`
                        : periodo === "semana"
                          ? `semana${Math.abs(offset) > 1 ? "s" : ""}`
                          : `mes${Math.abs(offset) > 1 ? "es" : ""}`
                    } atrás.`}{" "}
                Las alertas de inventario se actualizan en tiempo real.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">😕</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              No se pudieron cargar los datos
            </h3>
            <p className="text-gray-600 mb-4">
              Hubo un problema al cargar los reportes. Por favor, intenta
              nuevamente.
            </p>
            <button
              onClick={() => cargarDatos()}
              className="bg-gradient-to-r from-blue-600 to-red-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-red-600 transition-all duration-300"
            >
              Reintentar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
