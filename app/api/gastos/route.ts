// app/api/gastos/route.ts

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;
    const timeZone = "America/La_Paz";
    const ahora = new Date();

    const dateStringBolivia = ahora.toLocaleString("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const [month, day, year] = dateStringBolivia.split("/");
    const inicioDelDia = new Date(`${year}-${month}-${day}T00:00:00-04:00`);
    const finDelDia = new Date(`${year}-${month}-${day}T23:59:59-04:00`);

    const whereClause =
      userRole === "CAJERO"
        ? {
            creadoEn: { gte: inicioDelDia, lte: finDelDia },
            registradoPorId: userId,
          }
        : {
            creadoEn: { gte: inicioDelDia, lte: finDelDia },
          };

    const gastos = await prisma.gasto.findMany({
      where: whereClause,
      include: {
        registradoPor: {
          select: { name: true },
        },
      },
      orderBy: { creadoEn: "desc" },
    });

    return NextResponse.json(gastos, { status: 200 });
  } catch (error) {
    console.error("Error al obtener gastos:", error);
    return NextResponse.json(
      { message: "Error al obtener los gastos" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { descripcion, monto, metodoPago } = body;

    if (!descripcion || !monto || !metodoPago) {
      return NextResponse.json(
        { message: "Faltan campos requeridos: descripcion, monto, metodoPago" },
        { status: 400 },
      );
    }

    if (metodoPago !== "EFECTIVO" && metodoPago !== "QR") {
      return NextResponse.json(
        { message: "El método de pago debe ser EFECTIVO o QR" },
        { status: 400 },
      );
    }

    if (typeof monto !== "number" || monto <= 0) {
      return NextResponse.json(
        { message: "El monto debe ser un número mayor a 0" },
        { status: 400 },
      );
    }

    const nuevoGasto = await prisma.gasto.create({
      data: {
        descripcion: descripcion.trim(),
        monto,
        metodoPago,
        registradoPorId: session.user.id,
      },
      include: {
        registradoPor: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(nuevoGasto, { status: 201 });
  } catch (error) {
    console.error("Error al registrar gasto:", error);
    return NextResponse.json(
      { message: "Error al registrar el gasto" },
      { status: 500 },
    );
  }
}
