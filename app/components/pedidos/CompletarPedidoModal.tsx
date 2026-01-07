// app/components/pedidos/CompletarPedidoModal.tsx

"use client";

import { useState, useMemo } from "react";
import { MetodoPago } from "@prisma/client";
import { Pedido } from "@/app/types";

interface CompletarPedidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: Pedido | null;
  onPagoExitoso: () => void;
  setNotificacion: (msg: string, tipo: 'exito' | 'error') => void;
}

interface PagoInput {
  metodo: MetodoPago;
  monto: number;
  cambio: number;
}

export default function CompletarPedidoModal({
  isOpen,
  onClose,
  pedido,
  onPagoExitoso,
  setNotificacion,
}: CompletarPedidoModalProps) {
  const [descuento, setDescuento] = useState(0);
  const [modoPagoDividido, setModoPagoDividido] = useState(false);
  
  // Para modo pago simple
  const [metodo, setMetodo] = useState<MetodoPago>("EFECTIVO");
  const [montoRecibido, setMontoRecibido] = useState("");
  
  // Para modo pago dividido
  const [pagos, setPagos] = useState<PagoInput[]>([]);
  const [pagoActual, setPagoActual] = useState<PagoInput>({
    metodo: "EFECTIVO",
    monto: 0,
    cambio: 0
  });
  
  const [procesando, setProcesando] = useState(false);

  const saldo = pedido ? pedido.montoTotal - pedido.anticipo : 0;

  const totalFinal = useMemo(() => {
    return Math.max(0, saldo - descuento);
  }, [saldo, descuento]);

  const cambio = useMemo(() => {
    const monto = parseFloat(montoRecibido) || 0;
    if (!modoPagoDividido && metodo === "EFECTIVO" && monto > 0) {
      return monto - totalFinal;
    }
    return 0;
  }, [montoRecibido, totalFinal, metodo, modoPagoDividido]);

  const totalPagado = useMemo(() => {
    return pagos.reduce((sum, pago) => sum + pago.monto, 0);
  }, [pagos]);

  const faltaPagar = useMemo(() => {
    return totalFinal - totalPagado;
  }, [totalFinal, totalPagado]);

  const handleAgregarPago = () => {
    if (pagoActual.monto <= 0) {
      setNotificacion("El monto debe ser mayor a 0", "error");
      return;
    }

    if (pagoActual.monto > faltaPagar) {
      setNotificacion(`El monto no puede exceder lo que falta pagar (Bs. ${faltaPagar.toFixed(2)})`, "error");
      return;
    }

    const cambioCalculado = pagoActual.metodo === "EFECTIVO" && pagoActual.monto > faltaPagar
      ? pagoActual.monto - faltaPagar
      : 0;

    setPagos([...pagos, { ...pagoActual, cambio: cambioCalculado }]);
    setPagoActual({ metodo: "EFECTIVO", monto: 0, cambio: 0 });
  };

  const handleEliminarPago = (index: number) => {
    setPagos(pagos.filter((_, i) => i !== index));
  };

  const puedeConfirmar = useMemo(() => {
    if (descuento < 0 || descuento > saldo) return false;
    
    if (modoPagoDividido) {
      return Math.abs(totalPagado - totalFinal) < 0.01 && pagos.length > 0;
    } else {
      return metodo === "QR" || (metodo === "EFECTIVO" && cambio >= 0 && montoRecibido !== "");
    }
  }, [descuento, saldo, modoPagoDividido, totalPagado, totalFinal, pagos.length, metodo, cambio, montoRecibido]);

  const handleConfirmarPago = async () => {
    if (!pedido) return;
    
    setProcesando(true);

    try {
      let body: {
        descuento: number;
        pagos: {
          metodo: MetodoPago;
          monto: number;
          cambio: number;
        }[];
      };

      if (modoPagoDividido) {
        // Formato pago dividido
        body = {
          descuento: descuento,
          pagos: pagos.map(p => ({
            metodo: p.metodo,
            monto: p.monto,
            cambio: p.cambio
          }))
        };
      } else {
        // Formato pago simple
        const montoFinal = metodo === "QR" ? totalFinal : parseFloat(montoRecibido);
        const cambioFinal = metodo === "EFECTIVO" ? cambio : 0;
        
        body = {
          descuento: descuento,
          pagos: [{
            metodo: metodo,
            monto: montoFinal,
            cambio: cambioFinal
          }]
        };
      }

      const response = await fetch(`/api/pedidos/${pedido.id}/pagar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setNotificacion("Pedido completado con éxito!", "exito");
        onPagoExitoso();
        onClose();
        resetForm();
      } else {
        const errorData = await response.json();
        setNotificacion(`Error: ${errorData.message}`, "error");
      }
    } catch (error) {
      console.error(error);
      setNotificacion("Error de conexión al procesar el pago.", "error");
    } finally {
      setProcesando(false);
    }
  };

  const resetForm = () => {
    setDescuento(0);
    setModoPagoDividido(false);
    setMetodo("EFECTIVO");
    setMontoRecibido("");
    setPagos([]);
    setPagoActual({ metodo: "EFECTIVO", monto: 0, cambio: 0 });
  };

  if (!isOpen || !pedido) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-800">Completar Pedido</h2>
          <p className="text-sm text-gray-600 mt-1">
            Cliente: <span className="font-semibold">{pedido.cliente.nombre}</span>
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Información del Pedido */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <h3 className="font-semibold text-gray-800 mb-2">Detalles del Pedido:</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{pedido.detalles}</p>
          </div>

          {/* Sección de Montos */}
          <div className="bg-gradient-to-r from-blue-50 to-red-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-lg">
              <span className="text-gray-700">Monto Total del Pedido:</span>
              <span className="font-bold text-gray-900">Bs. {pedido.montoTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Anticipo Pagado:</span>
              <span>- Bs. {pedido.anticipo.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-300 pt-2 flex justify-between text-lg font-bold">
              <span className="text-gray-700">Saldo Pendiente:</span>
              <span className="text-blue-600">Bs. {saldo.toFixed(2)}</span>
            </div>

            {/* Input de Descuento */}
            <div className="border-t border-gray-300 pt-2">
              <div className="flex justify-between items-center">
                <label className="text-gray-700">Descuento:</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Bs.</span>
                  <input
                    type="number"
                    value={descuento}
                    onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    max={saldo}
                    className="w-24 text-right px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                  />
                </div>
              </div>
            </div>

            <div className="border-t-2 border-gray-400 pt-2 flex justify-between text-xl">
              <span className="font-bold text-gray-800">Total a Pagar:</span>
              <span className="font-extrabold text-green-600">Bs. {totalFinal.toFixed(2)}</span>
            </div>
          </div>

          {/* Toggle: Pago Simple vs Dividido */}
          <div className="flex items-center justify-center gap-4 bg-gray-50 p-3 rounded-xl">
            <span className="text-sm text-gray-700">Pago Simple</span>
            <button
              onClick={() => setModoPagoDividido(!modoPagoDividido)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                modoPagoDividido ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  modoPagoDividido ? "transform translate-x-7" : ""
                }`}
              />
            </button>
            <span className="text-sm text-gray-700">Pago Dividido</span>
          </div>

          {/* Modo Pago Simple */}
          {!modoPagoDividido && (
            <div className="space-y-4 animate-fade-in">
              {/* Selector de Método de Pago */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setMetodo("EFECTIVO")}
                  className={`py-4 rounded-xl text-lg font-semibold transition-all ${
                    metodo === "EFECTIVO"
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  💵 Efectivo
                </button>
                <button
                  onClick={() => setMetodo("QR")}
                  className={`py-4 rounded-xl text-lg font-semibold transition-all ${
                    metodo === "QR"
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  📱 QR
                </button>
              </div>

              {/* Input de Monto (Solo para Efectivo) */}
              {metodo === "EFECTIVO" && (
                <div className="space-y-4">
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
                      onChange={(e) => setMontoRecibido(e.target.value)}
                      placeholder="Ej: 50"
                      step="0.01"
                      className="w-full text-center text-2xl p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                    />
                  </div>

                  {cambio >= 0 && montoRecibido !== "" && (
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
          )}

          {/* Modo Pago Dividido */}
          {modoPagoDividido && (
            <div className="space-y-4 animate-fade-in">
              {/* Lista de Pagos Agregados */}
              {pagos.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <h3 className="font-semibold text-gray-800 mb-2">Pagos Agregados:</h3>
                  {pagos.map((pago, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200"
                    >
                      <div>
                        <span className="font-medium text-gray-900">
                          {pago.metodo === "EFECTIVO" ? "💵 Efectivo" : "📱 QR"}
                        </span>
                        <span className="ml-2 text-blue-600 font-bold">
                          Bs. {pago.monto.toFixed(2)}
                        </span>
                        {pago.cambio > 0 && (
                          <span className="ml-2 text-sm text-green-600">
                            (Cambio: Bs. {pago.cambio.toFixed(2)})
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleEliminarPago(index)}
                        className="text-red-500 hover:text-red-700 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <div className="border-t border-gray-300 pt-2 flex justify-between text-lg font-bold">
                    <span className="text-gray-900">Total Pagado:</span>
                    <span className="text-blue-600">Bs. {totalPagado.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="text-gray-900">Falta Pagar:</span>
                    <span className={faltaPagar > 0.01 ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                      Bs. {faltaPagar.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Agregar Nuevo Pago */}
              {faltaPagar > 0.01 && (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-gray-800">Agregar Pago:</h3>
                  
                  {/* Selector de Método */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPagoActual({ ...pagoActual, metodo: "EFECTIVO" })}
                      className={`py-3 rounded-lg text-sm font-semibold transition-all ${
                        pagoActual.metodo === "EFECTIVO"
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      💵 Efectivo
                    </button>
                    <button
                      onClick={() => setPagoActual({ ...pagoActual, metodo: "QR" })}
                      className={`py-3 rounded-lg text-sm font-semibold transition-all ${
                        pagoActual.metodo === "QR"
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      📱 QR
                    </button>
                  </div>

                  {/* Input Monto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monto
                    </label>
                    <input
                      type="number"
                      value={pagoActual.monto || ""}
                      onChange={(e) =>
                        setPagoActual({ ...pagoActual, monto: parseFloat(e.target.value) || 0 })
                      }
                      placeholder={`Máx: ${faltaPagar.toFixed(2)}`}
                      step="0.01"
                      min="0"
                      max={faltaPagar}
                      className="w-full text-center text-xl p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                    />
                  </div>

                  <button
                    onClick={handleAgregarPago}
                    className="w-full bg-green-600 text-white font-bold py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    + Agregar Pago
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="p-6 bg-gray-50 rounded-b-2xl grid grid-cols-2 gap-4 sticky bottom-0">
          <button
            onClick={onClose}
            className="py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmarPago}
            disabled={!puedeConfirmar || procesando}
            className="py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg disabled:shadow-none"
          >
            {procesando ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
            ) : (
              "Confirmar y Completar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
