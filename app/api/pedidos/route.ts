// app/api/pedidos/route.ts

import { NextResponse } from "next/server";
import { PrismaClient, Prisma, MetodoPago } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const pedidosActivos = await prisma.pedido.findMany({
      where: {
        NOT: {
          estado: {
            in: ["COMPLETADO", "CANCELADO"],
          },
        },
      },
      include: {
        cliente: true,
      },
      orderBy: {
        fechaEntrega: "asc",
      },
    });

    return NextResponse.json(pedidosActivos, { status: 200 });
  } catch (error) {
    console.error("Error en GET /api/pedidos:", error);
    return NextResponse.json(
      { message: "Error al obtener los pedidos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clienteId, detalles, fechaEntrega, montoTotal, anticipo, metodoPagoAnticipo } = body;

    if (!clienteId || !detalles || !fechaEntrega || !montoTotal) {
      return NextResponse.json(
        {
          message:
            "Faltan campos requeridos (clienteId, detalles, fechaEntrega, montoTotal)",
        },
        { status: 400 }
      );
    }
    
    if (metodoPagoAnticipo && !Object.values(MetodoPago).includes(metodoPagoAnticipo)) {
      return NextResponse.json({ message: "Método de pago de anticipo no válido" }, { status: 400 });
    }

    const totalNum = Number(montoTotal);
    const anticipoNum = anticipo ? Number(anticipo) : 0;

    if (isNaN(totalNum) || totalNum <= 0) {
      return NextResponse.json(
        { message: "El monto total debe ser un número positivo" },
        { status: 400 }
      );
    }
    if (isNaN(anticipoNum) || anticipoNum < 0) {
      return NextResponse.json(
        { message: "El anticipo debe ser un número positivo o cero" },
        { status: 400 }
      );
    }
    if (anticipoNum > totalNum) {
      return NextResponse.json(
        { message: "El anticipo no puede ser mayor al monto total" },
        { status: 400 }
      );
    }

    const nuevoPedido = await prisma.pedido.create({
      data: {
        clienteId: Number(clienteId),
        detalles: detalles,
        fechaEntrega: new Date(fechaEntrega),
        montoTotal: totalNum,
        anticipo: anticipoNum,
        metodoPagoAnticipo: metodoPagoAnticipo || MetodoPago.EFECTIVO,
      },
      include: {
        cliente: true,
      },
    });

    return NextResponse.json(nuevoPedido, { status: 201 });
  } catch (error) {
    console.error("Error al crear pedido:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        { message: "Error de clave foránea: El clienteId no existe." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Error interno al crear el pedido" },
      { status: 500 }
    );
  }
}
