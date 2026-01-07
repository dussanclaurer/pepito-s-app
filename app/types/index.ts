// app/types/index.ts

import { MetodoPago } from '@prisma/client';

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  inventario: number;
}

export interface CartItem extends Producto {
  cantidad: number;
}

export interface PagoDetalle {
  id?: number;
  metodoPago: MetodoPago;
  monto: number;
  cambio: number;
}

export interface VentaData {
  id: number;
  subtotal: number;
  descuento: number;
  total: number;
  metodoPago: MetodoPago; // Deprecated, mantener por compatibilidad
  montoRecibido: number; // Deprecated
  cambio: number; // Deprecated
  creadoEn: string;
  pagos?: PagoDetalle[];
}

export interface VentaParaRecibo {
  venta: VentaData;
  items: CartItem[];
}

export type EstadoPedido =
  | "PENDIENTE"
  | "EN_PROGRESO"
  | "LISTO_PARA_ENTREGA"
  | "COMPLETADO"
  | "CANCELADO";

export interface Cliente {
  id: number;
  nombre: string;
  telefono: string;
  creadoEn: string;
}

export interface PagoPedido {
  id: number;
  pedidoId: number;
  metodoPago: MetodoPago;
  monto: number;
  cambio: number;
  esSaldo: boolean;
  creadoEn: string;
}

export interface Pedido {
  id: number;
  detalles: string;
  fechaEntrega: string;
  montoTotal: number;
  anticipo: number;
  metodoPagoAnticipo: MetodoPago;
  descuentoSaldo: number;
  estado: EstadoPedido;
  creadoEn: string;
  actualizadoEn: string;
  
  clienteId: number;
  cliente: Cliente; 
  
  pagos?: PagoPedido[];
}

export interface VentaProductoDetalle {
  id: number;
  cantidad: number;
  precioUnitario: number;
  producto: {
    nombre: string;
  };
}

export interface VentaCompleta {
  id: number;
  subtotal: number;
  descuento: number;
  total: number;
  creadoEn: string;
  metodoPago: string; // Deprecated
  montoRecibido: number; // Deprecated
  cambio: number; // Deprecated
  productosVendidos: VentaProductoDetalle[];
  pagos: PagoDetalle[];
}