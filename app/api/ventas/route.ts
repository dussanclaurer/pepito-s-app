// app/api/ventas/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient, MetodoPago } from '@prisma/client';

const prisma = new PrismaClient();

interface CartItem {
  productoId: number;
  cantidad: number;
}

interface PaymentDetails {
  metodo: MetodoPago; 
  montoRecibido: number;
}

interface VentaRequest {
  cartItems: CartItem[];
  payment: PaymentDetails;
}

export async function POST(request: Request) {
  try {
    const { cartItems, payment }: VentaRequest = await request.json();

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ message: "El carrito está vacío" }, { status: 400 });
    }
    if (!payment || !payment.metodo || payment.montoRecibido === undefined) {
      return NextResponse.json({ message: "Faltan detalles del pago" }, { status: 400 });
    }

    const productIds = cartItems.map(item => item.productoId);
    const productosEnDB = await prisma.producto.findMany({
      where: {
        id: { in: productIds },
      },
    });

    const productosMap = new Map(productosEnDB.map(p => [p.id, p]));

    let totalVenta = 0;
    for (const item of cartItems) {
      const producto = productosMap.get(item.productoId);
      
      if (!producto) {
        return NextResponse.json(
          { message: `Producto con ID ${item.productoId} no encontrado.` },
          { status: 404 } 
        );
      }
      
      if (producto.inventario < item.cantidad) {
        return NextResponse.json(
          { message: `Stock insuficiente para el producto: ${producto.nombre}.` },
          { status: 400 } 
        );
      }
      totalVenta += producto.precio * item.cantidad;
    }


    if (payment.montoRecibido < totalVenta) {
      return NextResponse.json(
        { message: `Monto recibido (${payment.montoRecibido}) es menor que el total (${totalVenta}).` },
        { status: 400 } 
      );
    }

    const cambioCalculado = (payment.metodo === 'EFECTIVO') 
      ? payment.montoRecibido - totalVenta 
      : 0;

    const ventaRealizada = await prisma.$transaction(async (tx) => {
      
      const venta = await tx.venta.create({
        data: {
          total: totalVenta,
          metodoPago: payment.metodo,         
          montoRecibido: payment.montoRecibido, 
          cambio: cambioCalculado,           
        },
      });

      for (const item of cartItems) {
        const producto = productosMap.get(item.productoId)!; 
        
        await tx.ventaProducto.create({
          data: {
            ventaId: venta.id,
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioUnitario: producto.precio,
          },
        });

        await tx.producto.update({
          where: { id: item.productoId },
          data: {
            inventario: {
              decrement: item.cantidad,
            },
          },
        });
      }

      return venta;
    });

    return NextResponse.json(ventaRealizada, { status: 201 });

  } catch (error) {
    console.error("Error al procesar la venta:", error);
    
    let errorMessage = "Error al procesar la venta";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { message: errorMessage },
      { status: 500 } 
    );
  }
}
