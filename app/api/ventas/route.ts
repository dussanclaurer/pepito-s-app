// app/api/ventas/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient, MetodoPago } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

interface CartItem {
  productoId: number;
  cantidad: number;
}

interface PagoInput {
  metodo: MetodoPago;
  monto: number;
  cambio?: number;
}

interface PaymentDetails {
  metodo?: MetodoPago; // Deprecated, para compatibilidad
  montoRecibido?: number; // Deprecated
  pagos?: PagoInput[]; // Nueva forma: array de pagos
}

interface VentaRequest {
  cartItems: CartItem[];
  payment: PaymentDetails;
  descuento?: number;
}

export async function POST(request: Request) {
  try {
    // Obtener el usuario autenticado
    const session = await getServerSession(authOptions);
    const vendedorId = session?.user?.id || null;
    const { cartItems, payment, descuento = 0 }: VentaRequest = await request.json();

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ message: "El carrito está vacío" }, { status: 400 });
    }

    // Obtener productos desde la BD
    const productIds = cartItems.map(item => item.productoId);
    const productosEnDB = await prisma.producto.findMany({
      where: {
        id: { in: productIds },
      },
    });

    const productosMap = new Map(productosEnDB.map(p => [p.id, p]));

    // Calcular subtotal
    let subtotal = 0;
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
      subtotal += producto.precio * item.cantidad;
    }

    // Validar descuento
    if (descuento < 0 || descuento > subtotal) {
      return NextResponse.json(
        { message: `Descuento inválido (${descuento}). Debe estar entre 0 y ${subtotal}.` },
        { status: 400 }
      );
    }

    const totalFinal = subtotal - descuento;

    // Procesar pagos (soportar formato antiguo y nuevo)
    let pagosArray: PagoInput[] = [];
    
    if (payment.pagos && payment.pagos.length > 0) {
      // Nuevo formato: pagos divididos
      pagosArray = payment.pagos;
    } else if (payment.metodo && payment.montoRecibido !== undefined) {
      // Formato antiguo: un solo pago
      const cambioCalculado = (payment.metodo === 'EFECTIVO') 
        ? payment.montoRecibido - totalFinal 
        : 0;
      
      pagosArray = [{
        metodo: payment.metodo,
        monto: payment.montoRecibido,
        cambio: cambioCalculado
      }];
    } else {
      return NextResponse.json({ message: "Faltan detalles del pago" }, { status: 400 });
    }

    // Validar pagos según el modo
    if (payment.pagos && payment.pagos.length > 0) {
      // Modo pago dividido: la suma debe ser exacta
      const totalPagado = pagosArray.reduce((sum, pago) => sum + pago.monto, 0);
      
      if (Math.abs(totalPagado - totalFinal) > 0.01) { // Tolerancia de centavos
        return NextResponse.json(
          { message: `Total pagado (${totalPagado}) debe ser igual al total (${totalFinal}).` },
          { status: 400 }
        );
      }
    } else if (payment.metodo === "EFECTIVO") {
      // Modo pago simple efectivo: puede dar más (con cambio)
      if (payment.montoRecibido! < totalFinal) {
        return NextResponse.json(
          { message: `Monto recibido (${payment.montoRecibido}) es menor que el total (${totalFinal}).` },
          { status: 400 }
        );
      }
    }
    // Para QR en modo simple, el monto será igual al total (se asigna en pagosArray)


    // Crear venta y pagos en transacción
    const ventaRealizada = await prisma.$transaction(async (tx) => {
      
      // Crear venta con nuevo esquema
      const venta = await tx.venta.create({
        data: {
          subtotal: subtotal,
          descuento: descuento,
          total: totalFinal,
          vendedorId: vendedorId, // Registrar quién hizo la venta
          // Campos deprecados (mantener el primer pago para compatibilidad)
          metodoPago: pagosArray[0].metodo,
          montoRecibido: pagosArray[0].monto,
          cambio: pagosArray[0].cambio || 0,
        },
      });

      // Crear registros de pago en PagoDetalle
      for (const pago of pagosArray) {
        await tx.pagoDetalle.create({
          data: {
            ventaId: venta.id,
            metodoPago: pago.metodo,
            monto: pago.monto,
            cambio: pago.cambio || 0,
          },
        });
      }

      // Crear VentaProducto y actualizar inventario
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

      // Retornar venta con pagos
      return await tx.venta.findUnique({
        where: { id: venta.id },
        include: {
          pagos: true,
        },
      });
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
