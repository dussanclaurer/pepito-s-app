// app/components/pos/ReceiptModal.tsx

'use client';

interface VentaData {
  id: number;
  total: number;
  metodoPago: string;
  montoRecibido: number;
  cambio: number;
  creadoEn: string;
}

interface CartItem {
  nombre: string;
  precio: number;
  cantidad: number;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  ventaData?: VentaData | null;
  cartItems?: CartItem[] | null;
}

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
    // Fondo oscuro (backdrop) - Se oculta al imprimir
    <div className="non-printable fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      
      {/* Contenido del Modal - Se oculta al imprimir */}
      <div className="non-printable bg-white rounded-2xl shadow-xl w-full max-w-sm">
        
        {/* Cabecera del Modal (NO SE IMPRIME) */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Venta Exitosa</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>

        {/* --- ÁREA DE IMPRESIÓN --- 
            Aquí añadimos todos los estilos 'print:'
        */}
        <div 
          className="printable-area p-6 bg-white max-h-[60vh] overflow-y-auto
                     print:w-[300px] print:p-1 print:font-mono print:text-black print:text-xs
                     print:max-h-none print:overflow-visible"
        >
          {/* Este div 'receipt-content' no es estrictamente necesario
            ya que aplicamos los estilos al 'printable-area',
            pero mantenemos la estructura por si acaso.
          */}
          <div className="receipt-content"> 
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold print:text-base">Pastelería Pepito's</h3>
              <p className="text-xs print:text-xs">Recibo de Venta</p>
              <p className="text-xs text-gray-500 print:text-black">
                Fecha: {new Date(ventaData.creadoEn).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 print:text-black">
                Venta ID: #{ventaData.id.toString().padStart(6, '0')}
              </p>
            </div>

            {/* Items del Carrito */}
            <div className="space-y-1 mb-2 border-b border-dashed border-gray-300 print:border-black pb-2">
              {cartItems.map((item, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <div className="flex-1">
                    <p className="font-semibold uppercase">{item.nombre}</p>
                    <p className="text-gray-600 print:text-black">
                      {item.cantidad} x Bs. {item.precio.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold">
                    Bs. {(item.cantidad * item.precio).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            {/* Totales y Pago */}
            <div className="space-y-1">
              <div className="flex justify-between font-bold text-sm">
                <span>TOTAL:</span>
                <span>Bs. {ventaData.total.toFixed(2)}</span>
              </div>
              
              <div 
                className="border-t border-dashed border-gray-300 print:border-black 
                           pt-1 mt-1 space-y-0.5 text-xs text-gray-700 print:text-black"
              >
                <div className="flex justify-between">
                  <span>Método Pago:</span>
                  <span className="font-semibold">{ventaData.metodoPago}</span>
                </div>
                <div className="flex justify-between">
                  <span>Monto Recibido:</span>
                  <span>Bs. {ventaData.montoRecibido.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cambio:</span>
                  <span className="font-semibold">Bs. {ventaData.cambio.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Pie de Recibo */}
            <div className="text-center mt-4 pt-2 border-t border-dashed border-gray-300 print:border-black">
              <p className="text-xs text-gray-600 print:text-black">¡Gracias por su compra!</p>
            </div>
          </div>
        </div>
        {/* --- FIN ÁREA DE IMPRESIÓN --- */}

        {/* Acciones (NO SE IMPRIME) */}
        <div className="non-printable p-6 bg-gray-50 rounded-b-2xl grid grid-cols-2 gap-4">
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
  );
}
