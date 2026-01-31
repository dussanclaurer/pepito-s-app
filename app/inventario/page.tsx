// app/inventario/page.tsx

"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Tag,
  Cake,
  ClipboardList,
  Package,
  TrendingUp,
  Pencil,
  Trash2,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";

interface Categoria {
  id: number;
  nombre: string;
}

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  inventario: number;
  activo: boolean;
  categoriaId: number;
  categoria: Categoria;
  cantidadVendida: number;
}

interface Toast {
  id: number;
  type: "success" | "error" | "warning";
  message: string;
}

interface ConfirmDialog {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

const estadoInicialProducto = {
  nombre: "",
  precio: "",
  inventario: "",
  categoriaId: "",
};

export default function InventarioPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [nombreNuevaCategoria, setNombreNuevaCategoria] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(
    null,
  );
  const [productos, setProductos] = useState<Producto[]>([]);
  const [nuevoProducto, setNuevoProducto] = useState(estadoInicialProducto);
  const [cargando, setCargando] = useState(true);
  const [modalProductoAbierto, setModalProductoAbierto] = useState(false);
  const [modalCategoriaAbierto, setModalCategoriaAbierto] = useState(false);
  const [productoAEditar, setProductoAEditar] = useState<Producto | null>(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState<number | "todas">(
    "todas",
  );
  const [pestanaActiva, setPestanaActiva] = useState<
    "productos" | "categorias"
  >("productos");
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const router = useRouter();

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [resCategorias, resProductos] = await Promise.all([
        fetch("/api/categorias"),
        fetch(`/api/productos?mostrarInactivos=${mostrarInactivos}`),
      ]);
      const dataCategorias = await resCategorias.json();
      const dataProductos = await resProductos.json();
      setCategorias(dataCategorias);
      setProductos(dataProductos);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [mostrarInactivos]);

  // Sistema de Toast Notifications
  const mostrarToast = (
    type: "success" | "error" | "warning",
    message: string,
  ) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const cerrarToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Sistema de Confirmación
  const mostrarConfirmacion = (
    title: string,
    message: string,
    onConfirm: () => void,
  ) => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm });
  };

  const cerrarConfirmacion = () => {
    setConfirmDialog(null);
  };

  const handleCategoriaSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!nombreNuevaCategoria.trim()) return;

    try {
      await fetch("/api/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombreNuevaCategoria }),
      });
      setNombreNuevaCategoria("");
      setModalCategoriaAbierto(false);
      mostrarToast("success", "Categoría creada exitosamente");
      cargarDatos();
    } catch (error) {
      mostrarToast("error", "Error al crear categoría");
    }
  };

  const handleProductoSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (
      !nuevoProducto.nombre.trim() ||
      !nuevoProducto.precio ||
      !nuevoProducto.categoriaId
    )
      return;

    try {
      await fetch("/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...nuevoProducto,
          precio: parseFloat(nuevoProducto.precio as string),
          inventario: parseInt(nuevoProducto.inventario as string) || 0,
        }),
      });
      setNuevoProducto(estadoInicialProducto);
      setModalProductoAbierto(false);
      mostrarToast("success", "Producto creado exitosamente");
      cargarDatos();
    } catch (error) {
      mostrarToast("error", "Error al crear producto");
    }
  };

  const handleEditClick = (producto: Producto) => {
    setProductoAEditar(producto);
    setModalProductoAbierto(true);
  };

  const handleDeleteClick = (id: number) => {
    mostrarConfirmacion(
      "¿Desactivar producto?",
      "¿Estás seguro de que quieres desactivar este producto? Dejará de aparecer en el punto de venta pero se mantendrá el historial.",
      async () => {
        try {
          const res = await fetch(`/api/productos/${id}`, {
            method: "DELETE",
          });

          const data = await res.json();

          if (!res.ok) {
            mostrarToast(
              "error",
              data.message || "Error al desactivar producto",
            );
            return;
          }

          mostrarToast("success", "Producto desactivado exitosamente");
          cargarDatos();
        } catch (error) {
          mostrarToast("error", "Error al desactivar producto");
        } finally {
          cerrarConfirmacion();
        }
      },
    );
  };

  const handleReactivarClick = async (id: number) => {
    try {
      const res = await fetch(`/api/productos/${id}/reactivar`, {
        method: "PUT",
      });

      const data = await res.json();

      if (!res.ok) {
        mostrarToast("error", data.message || "Error al reactivar producto");
        return;
      }

      mostrarToast("success", "Producto reactivado exitosamente");
      cargarDatos();
    } catch (error) {
      mostrarToast("error", "Error al reactivar producto");
    }
  };

  const handleUpdateSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!productoAEditar) return;

    try {
      await fetch(`/api/productos/${productoAEditar.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: productoAEditar.nombre,
          precio: productoAEditar.precio,
          inventario: productoAEditar.inventario,
          categoriaId: productoAEditar.categoriaId,
        }),
      });

      setModalProductoAbierto(false);
      setProductoAEditar(null);
      mostrarToast("success", "Producto actualizado exitosamente");
      cargarDatos();
    } catch (error) {
      mostrarToast("error", "Error al actualizar producto");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (productoAEditar) {
      setProductoAEditar({
        ...productoAEditar,
        [name]:
          name === "precio" || name === "inventario"
            ? parseFloat(value) || 0
            : value,
      });
    } else {
      setNuevoProducto((prevState) => ({ ...prevState, [name]: value }));
    }
  };

  const handleDeleteCategoria = (id: number) => {
    mostrarConfirmacion(
      "¿Eliminar categoría?",
      "¿Estás seguro de que quieres eliminar esta categoría? Esta acción no se puede deshacer.",
      async () => {
        try {
          const res = await fetch(`/api/categorias/${id}`, {
            method: "DELETE",
          });

          const data = await res.json();

          if (!res.ok) {
            mostrarToast(
              "error",
              data.message || "Error al eliminar categoría",
            );
            return;
          }

          mostrarToast("success", "Categoría eliminada exitosamente");
          cargarDatos();
        } catch (error) {
          mostrarToast("error", "Error al eliminar categoría");
        } finally {
          cerrarConfirmacion();
        }
      },
    );
  };

  const abrirModalNuevoProducto = () => {
    setProductoAEditar(null);
    setNuevoProducto(estadoInicialProducto);
    setModalProductoAbierto(true);
  };

  const cerrarModalProducto = () => {
    setModalProductoAbierto(false);
    setProductoAEditar(null);
    setNuevoProducto(estadoInicialProducto);
  };

  const abrirModalNuevaCategoria = () => {
    setNombreNuevaCategoria("");
    setModalCategoriaAbierto(true);
  };

  const cerrarModalCategoria = () => {
    setModalCategoriaAbierto(false);
    setNombreNuevaCategoria("");
  };

  // Filtrar productos por categoría
  const productosFiltrados =
    categoriaFiltro === "todas"
      ? productos
      : productos.filter((p) => p.categoriaId === categoriaFiltro);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header con Pestañas */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setPestanaActiva("productos")}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${
                pestanaActiva === "productos"
                  ? "bg-gradient-to-r from-blue-600 to-red-500 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Cake className="w-5 h-5" />
                Productos
              </div>
            </button>
            <button
              onClick={() => setPestanaActiva("categorias")}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${
                pestanaActiva === "categorias"
                  ? "bg-gradient-to-r from-blue-600 to-red-500 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Tag className="w-5 h-5" />
                Categorías
              </div>
            </button>
          </div>

          {/* Contenido de Pestaña Productos */}
          {pestanaActiva === "productos" && (
            <div className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                    <ClipboardList className="w-5 h-5" />
                  </span>
                  Lista de Productos
                </h2>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mostrarInactivos}
                      onChange={(e) => setMostrarInactivos(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span>Mostrar inactivos</span>
                  </label>
                  <select
                    value={categoriaFiltro}
                    onChange={(e) =>
                      setCategoriaFiltro(
                        e.target.value === "todas"
                          ? "todas"
                          : parseInt(e.target.value),
                      )
                    }
                    className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                  >
                    <option value="todas">Todas las categorías</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                  <div className="text-sm text-gray-500">
                    {productosFiltrados.length} producto
                    {productosFiltrados.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              {cargando ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-6">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-gradient-to-r from-blue-50 to-red-50 border-b border-blue-200">
                            <th className="p-4 font-semibold text-gray-700 text-left">
                              Producto
                            </th>
                            <th className="p-4 font-semibold text-gray-700 text-left">
                              Categoría
                            </th>
                            <th className="p-4 font-semibold text-gray-700 text-left">
                              Precio
                            </th>
                            <th className="p-4 font-semibold text-gray-700 text-left">
                              Stock
                            </th>
                            <th className="p-4 font-semibold text-gray-700 text-left">
                              Stock Inicial del Día
                            </th>
                            <th className="p-4 font-semibold text-gray-700 text-left">
                              Vendidos Hoy
                            </th>
                            <th className="p-4 font-semibold text-gray-700 text-left">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {productosFiltrados.map((producto, index) => (
                            <tr
                              key={producto.id}
                              className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                                index === productosFiltrados.length - 1
                                  ? "border-b-0"
                                  : ""
                              } ${!producto.activo ? "opacity-50 bg-gray-50" : ""}`}
                            >
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-800">
                                    {producto.nombre}
                                  </span>
                                  {!producto.activo && (
                                    <span className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded-full">
                                      Inactivo
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                                  {producto.categoria.nombre}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className="font-bold text-green-600">
                                  Bs. {producto.precio.toFixed(2)}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-sm font-medium px-2 py-1 rounded-full ${
                                      producto.inventario > 10
                                        ? "bg-green-100 text-green-800"
                                        : producto.inventario > 0
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {producto.inventario} unidades
                                  </span>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <Package className="w-4 h-4 text-purple-600" />
                                  <span className="text-sm font-semibold text-gray-700">
                                    {producto.inventario +
                                      producto.cantidadVendida}{" "}
                                    uds.
                                  </span>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm font-semibold text-gray-700">
                                    {producto.cantidadVendida} uds.
                                  </span>
                                </div>
                              </td>
                              <td className="p-4">
                                {producto.activo ? (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleEditClick(producto)}
                                      className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-all duration-200 text-sm font-medium flex items-center gap-1"
                                    >
                                      <Pencil className="w-3 h-3" />
                                      Editar
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteClick(producto.id)
                                      }
                                      className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-all duration-200 text-sm font-medium flex items-center gap-1"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      Desactivar
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() =>
                                      handleReactivarClick(producto.id)
                                    }
                                    className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-all duration-200 text-sm font-medium flex items-center gap-1"
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                    Reactivar
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {productosFiltrados.length === 0 && (
                        <div className="text-center py-12">
                          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-500 text-lg">
                            {categoriaFiltro === "todas"
                              ? "No hay productos registrados"
                              : "No hay productos en esta categoría"}
                          </p>
                          <p className="text-gray-400 text-sm mt-2">
                            {categoriaFiltro === "todas"
                              ? "Agrega tu primer producto usando el botón +"
                              : "Prueba con otra categoría o agrega nuevos productos"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contenido de Pestaña Categorías */}
          {pestanaActiva === "categorias" && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                    <Tag className="w-5 h-5" />
                  </span>
                  Categorías
                </h2>
                <div className="text-sm text-gray-500">
                  {categorias.length} categoría
                  {categorias.length !== 1 ? "s" : ""}
                </div>
              </div>

              {cargando ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categorias.map((cat) => {
                    const productosEnCategoria = productos.filter(
                      (p) => p.categoriaId === cat.id,
                    ).length;
                    return (
                      <div
                        key={cat.id}
                        className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-4 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-gray-800">
                              {cat.nombre}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {productosEnCategoria} producto
                              {productosEnCategoria !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteCategoria(cat.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors p-2 rounded-lg"
                            title="Eliminar categoría"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {categorias.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <Tag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500 text-lg">
                        No hay categorías registradas
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        Agrega tu primera categoría usando el botón +
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Botón Flotante */}
      <button
        onClick={
          pestanaActiva === "productos"
            ? abrirModalNuevoProducto
            : abrirModalNuevaCategoria
        }
        className="fixed bottom-8 right-8 bg-gradient-to-r from-blue-600 to-red-500 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 z-40"
        title={
          pestanaActiva === "productos"
            ? "Agregar Producto"
            : "Agregar Categoría"
        }
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modal de Producto */}
      {modalProductoAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="backdrop-blur-xl bg-white/95 rounded-2xl shadow-2xl w-full max-w-md border border-white/20 transform transition-all">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                  {productoAEditar ? (
                    <Pencil className="w-5 h-5" />
                  ) : (
                    <Cake className="w-5 h-5" />
                  )}
                </span>
                {productoAEditar ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <button
                onClick={cerrarModalProducto}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={
                productoAEditar ? handleUpdateSubmit : handleProductoSubmit
              }
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre
                </label>
                <input
                  name="nombre"
                  value={
                    productoAEditar
                      ? productoAEditar.nombre
                      : nuevoProducto.nombre
                  }
                  onChange={handleInputChange}
                  type="text"
                  placeholder="Nombre del producto"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio (Bs.)
                </label>
                <input
                  name="precio"
                  value={
                    productoAEditar
                      ? productoAEditar.precio
                      : nuevoProducto.precio
                  }
                  onChange={handleInputChange}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inventario
                </label>
                <input
                  name="inventario"
                  value={
                    productoAEditar
                      ? productoAEditar.inventario
                      : nuevoProducto.inventario
                  }
                  onChange={handleInputChange}
                  type="number"
                  placeholder="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <select
                  name="categoriaId"
                  value={
                    productoAEditar
                      ? productoAEditar.categoriaId
                      : nuevoProducto.categoriaId
                  }
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                  required
                >
                  <option value="" disabled>
                    Selecciona una categoría
                  </option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={cerrarModalProducto}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-red-500 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-red-600 transition-all duration-300 shadow-lg"
                >
                  {productoAEditar ? "Guardar Cambios" : "Crear Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Categoría */}
      {modalCategoriaAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="backdrop-blur-xl bg-white/95 rounded-2xl shadow-2xl w-full max-w-md border border-white/20 transform transition-all">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                  <Tag className="w-5 h-5" />
                </span>
                Nueva Categoría
              </h2>
              <button
                onClick={cerrarModalCategoria}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCategoriaSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Categoría
                </label>
                <input
                  type="text"
                  value={nombreNuevaCategoria}
                  onChange={(e) => setNombreNuevaCategoria(e.target.value)}
                  placeholder="Ejemplo: Tortas, Helados, Bebidas..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={cerrarModalCategoria}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-red-500 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-red-600 transition-all duration-300 shadow-lg"
                >
                  Crear Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-lg transform transition-all duration-300 animate-slide-in ${
              toast.type === "success"
                ? "bg-green-500/95 text-white"
                : toast.type === "error"
                  ? "bg-red-500/95 text-white"
                  : "bg-yellow-500/95 text-white"
            }`}
          >
            {toast.type === "success" && <CheckCircle className="w-5 h-5" />}
            {toast.type === "error" && <AlertCircle className="w-5 h-5" />}
            {toast.type === "warning" && <AlertTriangle className="w-5 h-5" />}
            <span className="font-medium">{toast.message}</span>
            <button
              onClick={() => cerrarToast(toast.id)}
              className="ml-2 hover:opacity-70 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Modal de Confirmación */}
      {confirmDialog?.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="backdrop-blur-xl bg-white/95 rounded-2xl shadow-2xl w-full max-w-md border border-white/20 transform transition-all">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  {confirmDialog.title}
                </h2>
              </div>
              <p className="text-gray-600 mb-6">{confirmDialog.message}</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={cerrarConfirmacion}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold rounded-xl hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-lg"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
