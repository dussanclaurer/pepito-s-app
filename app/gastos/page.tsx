// app/gastos/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Receipt, Trash2, PlusCircle, Loader2 } from "lucide-react";

interface Gasto {
  id: number;
  descripcion: string;
  monto: number;
  metodoPago: "EFECTIVO" | "QR";
  creadoEn: string;
  registradoPor?: {
    name: string | null;
  } | null;
}

export default function GastosPage() {
  const { data: session } = useSession();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  // Formulario
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [metodoPago, setMetodoPago] = useState<"EFECTIVO" | "QR">("EFECTIVO");

  const userRole = (session?.user as { role?: string })?.role;

  const cargarGastos = useCallback(async () => {
    setCargando(true);
    try {
      const res = await fetch("/api/gastos");
      if (!res.ok) throw new Error("Error al cargar gastos");
      const data = await res.json();
      setGastos(data);
    } catch {
      setError("No se pudieron cargar los gastos.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarGastos();
  }, [cargarGastos]);

  const mostrarExito = (msg: string) => {
    setExito(msg);
    setTimeout(() => setExito(null), 3000);
  };

  const handleRegistrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const montoNum = parseFloat(monto);
    if (!descripcion.trim() || isNaN(montoNum) || montoNum <= 0) {
      setError("Ingresa una descripción válida y un monto mayor a 0.");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch("/api/gastos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descripcion: descripcion.trim(),
          monto: montoNum,
          metodoPago,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Error al registrar el gasto");
      }
      setDescripcion("");
      setMonto("");
      setMetodoPago("EFECTIVO");
      await cargarGastos();
      mostrarExito("¡Gasto registrado correctamente!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setEnviando(false);
    }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este gasto?")) return;
    setEliminandoId(id);
    try {
      const res = await fetch(`/api/gastos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Error al eliminar");
      }
      await cargarGastos();
      mostrarExito("Gasto eliminado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setEliminandoId(null);
    }
  };

  const totalGastos = gastos.reduce((acc, g) => acc + g.monto, 0);

  const formatHora = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-BO", {
      timeZone: "America/La_Paz",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-3 rounded-2xl shadow-lg">
            <Receipt className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Registro de Gastos
            </h1>
            <p className="text-gray-500 text-sm">
              Los gastos se descuentan del Total Neto en el Cierre de Caja
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ─── Formulario ─── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                Nuevo Gasto
              </h2>

              <form onSubmit={handleRegistrar} className="space-y-4">
                {/* Descripción */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Ej: Compra de azúcar, gas, etc."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                    required
                  />
                </div>

                {/* Monto */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Monto (Bs.)
                  </label>
                  <input
                    type="number"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                    required
                  />
                </div>

                {/* Método de Pago */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Método de Pago
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMetodoPago("EFECTIVO")}
                      className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 border-2 ${
                        metodoPago === "EFECTIVO"
                          ? "bg-green-500 border-green-500 text-white shadow-md"
                          : "bg-white border-gray-200 text-gray-600 hover:border-green-300"
                      }`}
                    >
                      💵 Efectivo
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetodoPago("QR")}
                      className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 border-2 ${
                        metodoPago === "QR"
                          ? "bg-blue-500 border-blue-500 text-white shadow-md"
                          : "bg-white border-gray-200 text-gray-600 hover:border-blue-300"
                      }`}
                    >
                      📱 QR
                    </button>
                  </div>
                </div>

                {/* Mensajes */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}
                {exito && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                    {exito}
                  </div>
                )}

                {/* Botón */}
                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold py-3 rounded-xl hover:from-red-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-wait flex items-center justify-center gap-2"
                >
                  {enviando ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-5 h-5" />
                      Registrar Gasto
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* ─── Lista de Gastos ─── */}
          <div className="lg:col-span-3 space-y-4">
            {/* Tarjeta resumen */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-6 text-white shadow-xl">
              <p className="text-sm font-medium opacity-90 mb-1">
                Total Gastos del Día
              </p>
              <p className="text-4xl font-extrabold">
                Bs. {totalGastos.toFixed(2)}
              </p>
              <p className="text-sm opacity-75 mt-1">
                {gastos.length} gasto{gastos.length !== 1 ? "s" : ""} registrado
                {gastos.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Lista */}
            <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800">
                  Gastos de Hoy
                </h2>
              </div>

              {cargando ? (
                <div className="flex justify-center items-center py-16">
                  <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-3" />
                    <p className="text-gray-500">Cargando gastos...</p>
                  </div>
                </div>
              ) : gastos.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-4">🎉</div>
                  <p className="text-gray-500 font-medium">
                    No hay gastos registrados hoy
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    Registra el primer gasto usando el formulario
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {gastos.map((gasto) => (
                    <div
                      key={gasto.id}
                      className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                            gasto.metodoPago === "EFECTIVO"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {gasto.metodoPago === "EFECTIVO" ? "💵" : "📱"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-800 truncate">
                            {gasto.descripcion}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                gasto.metodoPago === "EFECTIVO"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {gasto.metodoPago === "EFECTIVO"
                                ? "Efectivo"
                                : "QR"}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatHora(gasto.creadoEn)}
                            </span>
                            {gasto.registradoPor?.name && (
                              <span className="text-xs text-gray-400">
                                · {gasto.registradoPor.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-3">
                        <span className="font-bold text-red-600 text-lg whitespace-nowrap">
                          Bs. {gasto.monto.toFixed(2)}
                        </span>
                        {userRole === "ADMIN" && (
                          <button
                            onClick={() => handleEliminar(gasto.id)}
                            disabled={eliminandoId === gasto.id}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                            title="Eliminar gasto"
                          >
                            {eliminandoId === gasto.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
