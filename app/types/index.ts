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

export interface VentaData {
  id: number;
  total: number;
  metodoPago: MetodoPago; 
  montoRecibido: number;
  cambio: number;
  creadoEn: string;
}

export interface VentaParaRecibo {
  venta: VentaData;
  items: CartItem[];
}

import { EstadoPedido as PrismaEstadoPedido } from '@prisma/client';

export type EstadoPedido = PrismaEstadoPedido;

export interface Cliente {
  id: number;
  nombre: string;
  telefono: string;
  creadoEn: string;
}

export interface Pedido {
  id: number;
  detalles: string;
  fechaEntrega: string; 
  montoTotal: number;
  anticipo: number;
  estado: EstadoPedido;
  creadoEn: string;
  
  clienteId: number;
  cliente: Cliente; 
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
  total: number;
  creadoEn: string;
  metodoPago: string;
  montoRecibido: number;
  cambio: number;
  productosVendidos: VentaProductoDetalle[];
}