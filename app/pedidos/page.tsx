// app/pedidos/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pedido, Cliente, EstadoPedido } from "@/app/types";
import CompletarPedidoModal from "@/app/components/pedidos/CompletarPedidoModal";
import { PartyPopper } from "lucide-react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";

type MetodoPago = "EFECTIVO" | "QR";

const estadosDisponibles: EstadoPedido[] = [
  "PENDIENTE",
  "EN_PROGRESO",
  "LISTO_PARA_ENTREGA",
  "COMPLETADO",
  "CANCELADO",
];

const formatFechaEntrega = (isoString: string) => {
  const fecha = new Date(isoString);
  const timeZone = 'America/La_Paz';
  
  // Convertir de UTC a zona horaria de Bolivia
  const fechaBolivia = toZonedTime(fecha, timeZone);
  
  // Formatear la fecha
  return format(fechaBolivia, "d MMM, HH:mm", { locale: es });
};

const formatParaInput = (date: Date): string => {
  const anio = date.getFullYear();
  const mes = (date.getMonth() + 1).toString().padStart(2, "0");
  const dia = date.getDate().toString().padStart(2, "0");
  const hora = date.getHours().toString().padStart(2, "0");
  const minuto = date.getMinutes().toString().padStart(2, "0");
  return `${anio}-${mes}-${dia}T${hora}:${minuto}`;
};

export default function PedidosPage() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(true);
  const [notificacion, setNotificacion] = useState<{
    tipo: "exito" | "error";
    mensaje: string;
  } | null>(null);

  const [telefonoBusqueda, setTelefonoBusqueda] = useState("");
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null>(
    null
  );
  const [creandoCliente, setCreandoCliente] = useState(false);

  const [nuevoNombre, setNuevoNombre] = useState("");

  const [detalles, setDetalles] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState(formatParaInput(new Date()));
  const [montoTotal, setMontoTotal] = useState(0);
  const [anticipo, setAnticipo] = useState(0);
  const [metodoPagoAnticipo, setMetodoPagoAnticipo] =
    useState<MetodoPago>("EFECTIVO");

  const [enviando, setEnviando] = useState(false);

  // Estados para el modal de completar pedido
  const [pedidoParaCompletar, setPedidoParaCompletar] = useState<Pedido | null>(null);
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false);

  const mostrarNotificacion = (
    mensaje: string,
    tipo: "exito" | "error" = "error"
  ) => {
    setNotificacion({ tipo, mensaje });
    setTimeout(() => setNotificacion(null), 3500);
  };

  const cargarPedidos = async () => {
    setCargandoPedidos(true);
    try {
      const res = await fetch("/api/pedidos");
      if (!res.ok) throw new Error("Error al cargar pedidos");
      const data: Pedido[] = await res.json();
      setPedidos(data);
    } catch (error) {
      mostrarNotificacion("Error al cargar pedidos activos.");
    } finally {
      setCargandoPedidos(false);
    }
  };

  useEffect(() => {
    cargarPedidos();
  }, []);

  const handleBuscarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telefonoBusqueda) return;
    setClienteEncontrado(null);
    setCreandoCliente(false);

    try {
      const res = await fetch(`/api/clientes?telefono=${telefonoBusqueda}`);
      if (res.ok) {
        const data: Cliente = await res.json();
        setClienteEncontrado(data);
        mostrarNotificacion(`Cliente encontrado: ${data.nombre}`, "exito");
      } else {
        mostrarNotificacion("Cliente no encontrado. Puedes crear uno nuevo.");
        setCreandoCliente(true);
        setNuevoNombre("");
      }
    } catch (error) {
      mostrarNotificacion("Error al buscar cliente.");
    }
  };

  const resetFormulario = () => {
    setTelefonoBusqueda("");
    setClienteEncontrado(null);
    setCreandoCliente(false);
    setNuevoNombre("");
    setDetalles("");
    setFechaEntrega(formatParaInput(new Date()));
    setMontoTotal(0);
    setAnticipo(0);
    setMetodoPagoAnticipo("EFECTIVO");
    setEnviando(false);
  };

  const handleCrearPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    let clienteIdParaPedido: number | null = null;

    try {
      if (clienteEncontrado) {
        clienteIdParaPedido = clienteEncontrado.id;
      } else if (creandoCliente && nuevoNombre && telefonoBusqueda) {
        const resCliente = await fetch("/api/clientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: nuevoNombre,
            telefono: telefonoBusqueda,
          }),
        });
        if (!resCliente.ok) throw new Error("Error al crear el cliente");
        const nuevoCliente: Cliente = await resCliente.json();
        clienteIdParaPedido = nuevoCliente.id;
        mostrarNotificacion(`Cliente ${nuevoCliente.nombre} creado.`, "exito");
      } else {
        throw new Error("Debes buscar o crear un cliente primero.");
      }

      if (anticipo > montoTotal) {
        throw new Error("El anticipo no puede ser mayor al monto total.");
      }
      if (montoTotal <= 0) {
        throw new Error("El monto total debe ser mayor a cero.");
      }

      // Convertir fechaEntrega a ISO string con zona horaria de Bolivia
      // datetime-local devuelve formato "2026-01-09T15:30" sin zona horaria
      // Lo interpretamos como hora local de Bolivia y lo convertimos a UTC
      const fechaLocal = new Date(fechaEntrega);
      // Obtener el offset de Bolivia (-4 horas = -240 minutos)
      const offsetBolivia = -240; // GMT-4
      // Ajustar la fecha para que represente la hora local de Bolivia en UTC
      const fechaUTC = new Date(fechaLocal.getTime() - (offsetBolivia * 60 * 1000));
      const fechaEntregaISO = fechaUTC.toISOString();

      const resPedido = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: clienteIdParaPedido,
          detalles,
          fechaEntrega: fechaEntregaISO,
          montoTotal,
          anticipo,
          metodoPagoAnticipo,
        }),
      });

      if (!resPedido.ok) {
        const errorData = await resPedido.json();
        throw new Error(errorData.message || "Error al crear el pedido");
      }

      const pedidoCreado: Pedido = await resPedido.json();

      mostrarNotificacion("Pedido creado con éxito!", "exito");
      setPedidos([pedidoCreado, ...pedidos]);
      resetFormulario();
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : "Un error ocurrió.";
      mostrarNotificacion(mensaje, "error");
    } finally {
      setEnviando(false);
    }
  };

  const handleEstadoChange = async (
    pedidoId: number,
    nuevoEstado: EstadoPedido
  ) => {
    // Si se está marcando como COMPLETADO, mostrar modal de pago
    if (nuevoEstado === "COMPLETADO") {
      const pedido = pedidos.find((p) => p.id === pedidoId);
      if (pedido) {
        setPedidoParaCompletar(pedido);
        setModalPagoAbierto(true);
        return; // No continuar con el cambio de estado hasta que se procese el pago
      }
    }

    // Para otros estados o CANCELADO, continuar normalmente
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (!res.ok) throw new Error("Error al actualizar estado");

      const pedidoActualizado: Pedido = await res.json();

      if (nuevoEstado === "CANCELADO") {
        setPedidos(pedidos.filter((p) => p.id !== pedidoId));
        mostrarNotificacion(
          `Pedido #${pedidoId} marcado como ${nuevoEstado}.`,
          "exito"
        );
      } else {
        setPedidos(
          pedidos.map((p) => (p.id === pedidoId ? pedidoActualizado : p))
        );
      }
    } catch (error) {
      mostrarNotificacion("Error al actualizar el estado del pedido.", "error");
    }
  };

  const handlePagoSaldoExitoso = () => {
    setModalPagoAbierto(false);
    setPedidoParaCompletar(null);
    cargarPedidos(); // Recargar lista (pedido ahora estará completado y filtrado)
  };

  const getEstadoColor = (estado: EstadoPedido) => {
    switch (estado) {
      case "PENDIENTE":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "EN_PROGRESO":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "LISTO_PARA_ENTREGA":
        return "bg-green-100 text-green-800 border-green-300";
      case "COMPLETADO":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "CANCELADO":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50">
      {/* --- Contenedor de Notificación --- */}
      {notificacion && (
        <div
          className={`fixed top-20 right-4 left-4 sm:left-auto sm:right-6 sm:w-auto px-4 sm:px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in-out text-center sm:text-left
          ${
            notificacion.tipo === "exito"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {notificacion.mensaje}
        </div>
      )}

      {/* --- Contenido Principal --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* === Columna 1: Formulario de Nuevo Pedido === */}
          <div className="lg:col-span-1">
            <form
              onSubmit={handleCrearPedido}
              className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-blue-100 space-y-4 sm:space-y-6"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                Registrar Pedido
              </h2>

              {/* --- Sección 1: Cliente --- */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-blue-700 border-b border-blue-200 pb-2">
                  1. Cliente
                </h3>
                <label className="block">
                  <span className="text-gray-700 font-medium">
                    Teléfono del Cliente
                  </span>
                  <div className="flex space-x-2 mt-1">
                    <input
                      type="tel"
                      value={telefonoBusqueda}
                      onChange={(e) => setTelefonoBusqueda(e.target.value)}
                      placeholder="Buscar por teléfono..."
                      className="w-full px-4 py-3 sm:py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 text-base"
                    />
                    <button
                      type="button"
                      onClick={handleBuscarCliente}
                      className="bg-blue-600 text-white px-4 py-3 sm:px-4 sm:py-3 rounded-xl font-semibold hover:bg-blue-700 whitespace-nowrap"
                    >
                      Buscar
                    </button>
                  </div>
                </label>

                {/* Info del cliente */}
                {clienteEncontrado && (
                  <div className="bg-green-50 border border-green-300 text-green-800 p-3 rounded-xl">
                    <span className="font-bold block">
                      Cliente: {clienteEncontrado.nombre}
                    </span>
                    <span className="text-sm">
                      Tel: {clienteEncontrado.telefono}
                    </span>
                  </div>
                )}

                {/* Formulario para nuevo cliente */}
                {creandoCliente && (
                  <label className="block animate-fade-in">
                    <span className="text-gray-700 font-medium">
                      Nombre del Nuevo Cliente
                    </span>
                    <input
                      type="text"
                      value={nuevoNombre}
                      onChange={(e) => setNuevoNombre(e.target.value)}
                      placeholder="Ej: Ana López"
                      required
                      className="w-full mt-1 px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </label>
                )}
              </div>

              {/* --- Sección 2: Pedido --- */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-blue-700 border-b border-blue-200 pb-2">
                  2. Detalles del Pedido
                </h3>

                <label className="block">
                  <span className="text-gray-700 font-medium">Descripción</span>
                  <textarea
                    value={detalles}
                    onChange={(e) => setDetalles(e.target.value)}
                    rows={4}
                    placeholder="Ej: Torta 3 leches, 2 pisos, temática de Spiderman, 'Feliz Cumpleaños Lucas'"
                    required
                    className="w-full mt-1 px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </label>

                <label className="block">
                  <span className="text-gray-700 font-medium">
                    Fecha y Hora de Entrega
                  </span>
                  <input
                    type="datetime-local"
                    value={fechaEntrega}
                    onChange={(e) => setFechaEntrega(e.target.value)}
                    required
                    className="w-full mt-1 px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-gray-700 font-medium">
                      Monto Total (Bs.)
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={montoTotal}
                      onChange={(e) =>
                        setMontoTotal(parseFloat(e.target.value) || 0)
                      }
                      required
                      className="w-full mt-1 px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </label>
                  <label className="block">
                    <span className="text-gray-700 font-medium">
                      Anticipo (Bs.)
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={anticipo}
                      onChange={(e) =>
                        setAnticipo(parseFloat(e.target.value) || 0)
                      }
                      className="w-full mt-1 px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </label>
                </div>
                {anticipo > 0 && (
                  <div className="pt-2">
                    <span className="text-gray-700 font-medium">
                      Método de Pago del Anticipo
                    </span>
                    <div className="mt-2 flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="metodoPagoAnticipo"
                          value="EFECTIVO"
                          checked={metodoPagoAnticipo === "EFECTIVO"}
                          onChange={() => setMetodoPagoAnticipo("EFECTIVO")}
                          className="form-radio h-5 w-5 text-blue-600"
                        />
                        <span className="ml-2 text-gray-700">Efectivo</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="metodoPagoAnticipo"
                          value="QR"
                          checked={metodoPagoAnticipo === "QR"}
                          onChange={() => setMetodoPagoAnticipo("QR")}
                          className="form-radio h-5 w-5 text-blue-600"
                        />
                        <span className="ml-2 text-gray-700">QR</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* --- Sección 3: Submit --- */}
              <button
                type="submit"
                disabled={enviando || (!clienteEncontrado && !creandoCliente)}
                className="w-full bg-gradient-to-r from-blue-600 to-red-500 text-white font-bold py-4 rounded-xl hover:from-blue-700 hover:to-red-600 transition-all duration-300 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {enviando ? "Registrando..." : "Registrar Pedido"}
              </button>
            </form>
          </div>

          {/* === Columna 2: Lista de Pedidos Activos === */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Pedidos Activos
              </h2>

              {cargandoPedidos ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : pedidos.length === 0 ? (
                <div className="text-center py-12">
                  <PartyPopper className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                  <p className="text-gray-500 text-lg">
                    ¡No hay pedidos pendientes!
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Todos los pedidos están completados.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                  {/* Card de Pedido */}
                  {pedidos.map((pedido) => {
                    const saldo = pedido.montoTotal - pedido.anticipo;
                    return (
                      <div
                        key={pedido.id}
                        className="bg-gradient-to-r from-blue-50 to-red-50 rounded-xl p-5 border border-blue-100 shadow-md"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-sm font-semibold text-blue-700">
                              Entrega: {formatFechaEntrega(pedido.fechaEntrega)}
                            </p>
                            <h3 className="text-lg font-bold text-gray-800">
                              {pedido.cliente.nombre}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {pedido.cliente.telefono}
                            </p>
                          </div>
                          <span
                            className={`text-xs font-bold px-3 py-1 rounded-full border ${getEstadoColor(
                              pedido.estado
                            )}`}
                          >
                            {pedido.estado.replace("_", " ")}
                          </span>
                        </div>

                        <p className="text-sm text-gray-700 bg-white p-3 rounded-md border border-gray-200 mb-4 whitespace-pre-wrap">
                          {pedido.detalles}
                        </p>

                        <div className="grid grid-cols-3 gap-2 text-center mb-4">
                          <div className="bg-white p-2 rounded-lg border border-gray-200">
                            <span className="text-xs text-gray-500 block">
                              Total
                            </span>
                            <span className="font-bold text-green-600">
                              Bs. {pedido.montoTotal.toFixed(2)}
                            </span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-gray-200">
                            <span className="text-xs text-gray-500 block">
                              Anticipo
                            </span>
                            <span className="font-bold text-blue-600">
                              Bs. {pedido.anticipo.toFixed(2)}
                            </span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-gray-200">
                            <span className="text-xs text-gray-500 block">
                              Saldo
                            </span>
                            <span className="font-bold text-red-600">
                              Bs. {saldo.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-600">
                            Actualizar estado:
                          </span>
                          <select
                            value={pedido.estado}
                            onChange={(e) =>
                              handleEstadoChange(
                                pedido.id,
                                e.target.value as EstadoPedido
                              )
                            }
                            className="text-sm border border-gray-300 rounded-lg py-1 px-2 focus:ring-2 focus:ring-blue-500 text-gray-900"
                          >
                            {estadosDisponibles.map((estado) => (
                              <option key={estado} value={estado}>
                                {estado.replace("_", " ")}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Completar Pedido */}
      <CompletarPedidoModal
        isOpen={modalPagoAbierto}
        onClose={() => {
          setModalPagoAbierto(false);
          setPedidoParaCompletar(null);
        }}
        pedido={pedidoParaCompletar}
        onPagoExitoso={handlePagoSaldoExitoso}
        setNotificacion={mostrarNotificacion}
      />
    </div>
  );
}

