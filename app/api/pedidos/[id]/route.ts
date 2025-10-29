// app/api/pedidos/[id]/route.ts

import { NextResponse } from "next/server";
import { PrismaClient, Prisma, EstadoPedido } from "@prisma/client";

const prisma = new PrismaClient();

const validEstados = Object.values(EstadoPedido);

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { message: "ID de pedido inválido" },
        { status: 400 }
      );
    }

    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: { cliente: true },
    });

    if (!pedido) {
      return NextResponse.json(
        { message: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(pedido, { status: 200 });
  } catch (error) {
    console.error(`Error en GET /api/pedidos/${params.id}:`, error);
    return NextResponse.json(
      { message: "Error al obtener el pedido" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { message: "ID de pedido inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { estado, montoTotal, anticipo, detalles, fechaEntrega } = body;

    if (estado && !validEstados.includes(estado as EstadoPedido)) {
      return NextResponse.json(
        { message: `Estado '${estado}' no es válido.` },
        { status: 400 }
      );
    }

    const dataToUpdate: Prisma.PedidoUpdateInput = {};

    if (estado) dataToUpdate.estado = estado;
    if (detalles) dataToUpdate.detalles = detalles;
    if (montoTotal !== undefined) dataToUpdate.montoTotal = Number(montoTotal);
    if (anticipo !== undefined) dataToUpdate.anticipo = Number(anticipo);
    if (fechaEntrega) dataToUpdate.fechaEntrega = new Date(fechaEntrega);

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { message: "No se proporcionaron datos para actualizar" },
        { status: 400 }
      );
    }

    const pedidoActualizado = await prisma.pedido.update({
      where: { id },
      data: dataToUpdate,
      include: { cliente: true },
    });

    return NextResponse.json(pedidoActualizado, { status: 200 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { message: "Registro para actualizar no encontrado." },
        { status: 404 }
      );
    }

    console.error(`Error en PATCH /api/pedidos/${params.id}:`, error);
    return NextResponse.json(
      { message: "Error al actualizar el pedido" },
      { status: 500 }
    );
  }
}
