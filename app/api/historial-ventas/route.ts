// app/api/historial-ventas/route.ts

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const periodo = searchParams.get("periodo") || "dia";
  const timeZone = "America/La_Paz";

  const ahoraLocal = toZonedTime(new Date(), timeZone);

  let fechaInicioLocal: Date;
  let fechaFinLocal: Date;

  switch (periodo) {
    case "semana":
      fechaInicioLocal = startOfWeek(ahoraLocal);
      fechaFinLocal = endOfWeek(ahoraLocal);
      break;
    case "mes":
      fechaInicioLocal = startOfMonth(ahoraLocal);
      fechaFinLocal = endOfMonth(ahoraLocal);
      break;
    case "dia":
    default:
      fechaInicioLocal = startOfDay(ahoraLocal);
      fechaFinLocal = endOfDay(ahoraLocal);
      break;
  }

  // Convertir a UTC para consultas a la base de datos
  const fechaInicio = fromZonedTime(fechaInicioLocal, timeZone);
  const fechaFin = fromZonedTime(fechaFinLocal, timeZone);

  try {
    const ventas = await prisma.venta.findMany({
      where: {
        creadoEn: { gte: fechaInicio, lte: fechaFin },
      },
      include: {
        productosVendidos: {
          include: {
            producto: { select: { nombre: true } },
          },
        },
        pagos: true, // Incluir detalles de pago
      },
      orderBy: { creadoEn: "desc" },
    });

    return NextResponse.json(ventas);
  } catch (error) {
    console.error("Error al obtener historial de ventas:", error);
    return NextResponse.json(
      { message: "Error al obtener el historial de ventas" },
      { status: 500 }
    );
  }
}
