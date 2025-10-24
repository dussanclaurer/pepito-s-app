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
