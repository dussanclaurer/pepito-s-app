// app/api/clientes/route.ts

import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const telefono = searchParams.get("telefono");

  try {
    if (telefono) {
      const cliente = await prisma.cliente.findUnique({
        where: { telefono },
      });

      if (!cliente) {
        return NextResponse.json(
          { message: "Cliente no encontrado" },
          { status: 404 }
        );
      }
      return NextResponse.json(cliente, { status: 200 });
    } else {
      const clientes = await prisma.cliente.findMany({
        orderBy: { nombre: "asc" },
      });
      return NextResponse.json(clientes, { status: 200 });
    }
  } catch (error) {
    console.error("Error en GET /api/clientes:", error);
    return NextResponse.json(
      { message: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, telefono } = body;

    if (!nombre || !telefono) {
      return NextResponse.json(
        { message: "Nombre y teléfono son requeridos" },
        { status: 400 }
      );
    }

    const nuevoCliente = await prisma.cliente.create({
      data: {
        nombre,
        telefono,
      },
    });

    return NextResponse.json(nuevoCliente, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { message: "Ya existe un cliente con este número de teléfono" },
          { status: 409 }
        );
      }
    }

    console.error("Error al crear cliente:", error);
    return NextResponse.json(
      { message: "Error al crear cliente" },
      { status: 500 }
    );
  }
}
