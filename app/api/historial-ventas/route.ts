// app/api/historial-ventas/route.ts

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { toZonedTime } from "date-fns-tz";
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

  const ahora = toZonedTime(new Date(), timeZone);

  let fechaInicio: Date;
  let fechaFin: Date;

  switch (periodo) {
    case "semana":
      fechaInicio = startOfWeek(ahora);
      fechaFin = endOfWeek(ahora);
      break;
    case "mes":
      fechaInicio = startOfMonth(ahora);
      fechaFin = endOfMonth(ahora);
      break;
    case "dia":
    default:
      fechaInicio = startOfDay(ahora);
      fechaFin = endOfDay(ahora);
      break;
  }

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
