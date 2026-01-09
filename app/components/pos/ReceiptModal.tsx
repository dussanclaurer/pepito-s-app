// app/components/pos/ReceiptModal.tsx

"use client";

import { VentaData, CartItem } from "@/app/types";
import { Banknote, Smartphone } from "lucide-react";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  ventaData?: VentaData | null;
  cartItems?: CartItem[] | null;
}

const ReceiptContent = ({
  ventaData,
  cartItems,
}: {
  ventaData: VentaData;
  cartItems: CartItem[];
}) => (
  <>
    <div className="text-center mb-4">
      {/* Usamos clases print: para el estilo de impresión */}
      <h3 className="text-lg font-bold print:text-base text-gray-900">
        Pastelería Pepito&apos;s
      </h3>
      <p className="text-xs print:text-xs text-gray-900">Recibo de Venta</p>
      <p className="text-xs text-gray-500 print:text-black">
        Fecha: {new Date(ventaData.creadoEn).toLocaleString()}
      </p>
      <p className="text-xs text-gray-500 print:text-black">
        Venta ID: #{ventaData.id.toString().padStart(6, "0")}
      </p>
    </div>

    {/* Items del Carrito */}
    <div className="space-y-1 mb-2 border-b border-dashed border-gray-300 print:border-black pb-2">
      {cartItems.map((item, index) => (
        <div key={index} className="flex justify-between text-xs">
          <div className="flex-1">
            <p className="font-semibold uppercase text-gray-900">{item.nombre}</p>
            <p className="text-gray-600 print:text-black">
              {item.cantidad} x Bs. {item.precio.toFixed(2)}
            </p>
          </div>
          <p className="font-semibold text-gray-900">
            Bs. {(item.cantidad * item.precio).toFixed(2)}
          </p>
        </div>
      ))}
    </div>

    {/* Totales y Pago */}
    <div className="space-y-1">
      {/* Subtotal y Descuento */}
      {ventaData.descuento > 0 && (
        <>
          <div className="flex justify-between text-sm text-gray-900">
            <span>Subtotal:</span>
            <span>Bs. {ventaData.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-red-600 print:text-black">
            <span>Descuento:</span>
            <span>- Bs. {ventaData.descuento.toFixed(2)}</span>
          </div>
        </>
      )}
      
      <div className="flex justify-between font-bold text-sm text-gray-900">
        <span>TOTAL:</span>
        <span>Bs. {ventaData.total.toFixed(2)}</span>
      </div>

      <div
        className="border-t border-dashed border-gray-300 print:border-black 
                   pt-1 mt-1 space-y-0.5 text-xs text-gray-700 print:text-black"
      >
        {/* Mostrar pagos */}
        {ventaData.pagos && ventaData.pagos.length > 0 ? (
          <>
            <div className="font-semibold text-gray-900">Métodos de Pago:</div>
            {ventaData.pagos.map((pago, index) => (
              <div key={index} className="flex justify-between pl-2 text-gray-900">
                <span className="flex items-center gap-1">
                  {pago.metodoPago === "EFECTIVO" ? (
                    <><Banknote className="w-3 h-3" />Efectivo</>
                  ) : (
                    <><Smartphone className="w-3 h-3" />QR</>
                  )}:
                </span>
                <span className="font-semibold">Bs. {pago.monto.toFixed(2)}</span>
              </div>
            ))}
            {/* Mostrar cambio total si hay efectivo */}
            {ventaData.pagos.some(p => p.cambio > 0) && (
              <div className="flex justify-between pl-2 border-t border-gray-200 print:border-gray-400 pt-0.5 mt-0.5 text-gray-900">
                <span>Cambio:</span>
                <span className="font-semibold">
                  Bs. {ventaData.pagos.reduce((sum, p) => sum + p.cambio, 0).toFixed(2)}
                </span>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Fallback para ventas antiguas sin pagos[] */}
            <div className="flex justify-between text-gray-900">
              <span>Método Pago:</span>
              <span className="font-semibold">{ventaData.metodoPago}</span>
            </div>
            <div className="flex justify-between text-gray-900">
              <span>Monto Recibido:</span>
              <span>Bs. {ventaData.montoRecibido.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-900">
              <span>Cambio:</span>
              <span className="font-semibold">
                Bs. {ventaData.cambio.toFixed(2)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>

    {/* Pie de Recibo */}
    <div className="text-center mt-4 pt-2 border-t border-dashed border-gray-300 print:border-black">
      <p className="text-xs text-gray-600 print:text-black">
        ¡Gracias por su compra!
      </p>
    </div>
  </>
);

export default function ReceiptModal({
  isOpen,
  onClose,
  ventaData,
  cartItems,
}: ReceiptModalProps) {
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen || !ventaData || !cartItems) return null;

  return (
    <>
      {/* --- 1. EL MODAL VISUAL (se oculta al imprimir) --- */}
      <div className="print:hidden fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
        {/* Contenido del Modal */}
        <div className="backdrop-blur-xl bg-cyan-50/98 sm:bg-white/95 rounded-none sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-w-sm border-0 sm:border border-cyan-200/50 sm:border-white/20">
          {/* Cabecera del Modal */}
          <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Venta Exitosa</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              &times;
            </button>
          </div>

          {/* Área de SCROLL del modal VISUAL */}
          <div className="p-6 bg-white max-h-[60vh] overflow-y-auto">
            {/* Reutilizamos el contenido del recibo */}
            <ReceiptContent ventaData={ventaData} cartItems={cartItems} />
          </div>

          {/* Acciones */}
          <div className="p-6 bg-gray-50 rounded-b-2xl grid grid-cols-2 gap-4">
            <button
              onClick={onClose}
              className="py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handlePrint}
              className="py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg"
            >
              Imprimir Recibo
            </button>
          </div>
        </div>
      </div>

      {/* --- 2. EL RECIBO OCULTO (Solo visible al imprimir) --- */}
      <div
        className="printable-area hidden print:block 
                   w-[300px] p-1 font-mono text-black text-xs"
      >
        {/* Reutilizamos el contenido del recibo */}
        <ReceiptContent ventaData={ventaData} cartItems={cartItems} />
      </div>
    </>
  );
}

