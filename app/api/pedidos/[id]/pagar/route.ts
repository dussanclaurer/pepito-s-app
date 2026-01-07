//app/api/pedidos/[id]/pagar/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, MetodoPago } from "@prisma/client";

const prisma = new PrismaClient();

interface PagoInput {
  metodo: MetodoPago;
  monto: number;
  cambio?: number;
}

interface PagarSaldoRequest {
  descuento?: number;
  pagos: PagoInput[];
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pedidoId = parseInt(id, 10);

    if (isNaN(pedidoId)) {
      return NextResponse.json(
        { message: "ID de pedido inválido" },
        { status: 400 }
      );
    }

    // Buscar el pedido
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: { cliente: true },
    });

    if (!pedido) {
      return NextResponse.json(
        { message: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    if (pedido.estado === "COMPLETADO") {
      return NextResponse.json(
        { message: "Este pedido ya está completado" },
        { status: 400 }
      );
    }

    // Parse request body
    const { descuento = 0, pagos }: PagarSaldoRequest = await request.json();

    // Calcular saldo
    const saldo = pedido.montoTotal - pedido.anticipo;

    // Validar descuento
    if (descuento < 0 || descuento > saldo) {
      return NextResponse.json(
        { message: `El descuento no puede ser negativo ni mayor al saldo (${saldo.toFixed(2)} Bs)` },
        { status: 400 }
      );
    }

    const totalAPagar = saldo - descuento;

    // Validar que se proporcionaron pagos
    if (!pagos || pagos.length === 0) {
      return NextResponse.json(
        { message: "Debes proporcionar al menos un método de pago" },
        { status: 400 }
      );
    }

    // Validar que la suma de pagos coincide con el total
    const totalPagado = pagos.reduce((sum, pago) => sum + pago.monto, 0);

    if (Math.abs(totalPagado - totalAPagar) > 0.01) {
      return NextResponse.json(
        { message: `Total pagado (${totalPagado.toFixed(2)}) debe ser igual al total a pagar (${totalAPagar.toFixed(2)})` },
        { status: 400 }
      );
    }

    // Procesar el pago en una transacción
    const pedidoActualizado = await prisma.$transaction(async (tx) => {
      // Crear registros de pago
      for (const pago of pagos) {
        await tx.pagoPedido.create({
          data: {
            pedidoId: pedidoId,
            metodoPago: pago.metodo,
            monto: pago.monto,
            cambio: pago.cambio || 0,
            esSaldo: true,
          },
        });
      }

      // Actualizar pedido: aplicar descuento y marcar como completado
      const updated = await tx.pedido.update({
        where: { id: pedidoId },
        data: {
          descuentoSaldo: descuento,
          estado: "COMPLETADO",
        },
        include: {
          cliente: true,
          pagos: true,
        },
      });

      return updated;
    });

    return NextResponse.json(pedidoActualizado, { status: 200 });
  } catch (error) {
    console.error("Error al procesar pago del saldo:", error);
    return NextResponse.json(
      { message: "Error al procesar el pago del saldo" },
      { status: 500 }
    );
  }
}
