// app/api/reportes/route.ts

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
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get("periodo") || "dia";
    const umbralInventario = parseInt(searchParams.get("umbral") || "5");
    const timeZone = "America/La_Paz";

    const now = new Date();
    const zonedNow = toZonedTime(now, timeZone);

    let fechaInicioLocal: Date;
    let fechaFinLocal: Date;

    switch (periodo) {
      case "semana":
        fechaInicioLocal = startOfWeek(zonedNow);
        fechaFinLocal = endOfWeek(zonedNow);
        break;
      case "mes":
        fechaInicioLocal = startOfMonth(zonedNow);
        fechaFinLocal = endOfMonth(zonedNow);
        break;
      case "dia":
      default:
        fechaInicioLocal = startOfDay(zonedNow);
        fechaFinLocal = endOfDay(zonedNow);
        break;
    }

    // Convertir de hora local de Bolivia a UTC para consultas a la base de datos
    const fechaInicio = fromZonedTime(fechaInicioLocal, timeZone);
    const fechaFin = fromZonedTime(fechaFinLocal, timeZone);

    const resumenVentas = await prisma.venta.aggregate({
      where: {
        creadoEn: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
    });

    const inventarioBajo = await prisma.producto.findMany({
      where: {
        inventario: {
          lte: umbralInventario,
        },
      },
      orderBy: {
        inventario: "asc",
      },
    });

    const resultado = {
      ventasPorPeriodo: {
        totalIngresos: resumenVentas._sum.total || 0,
        numeroDeVentas: resumenVentas._count.id,
        periodo: periodo,
      },
      alertaInventario: inventarioBajo,
    };

    return NextResponse.json(resultado, { status: 200 });
  } catch (error) {
    console.error("Error al generar reportes:", error);
    return NextResponse.json(
      { message: "Error al generar los reportes" },
      { status: 500 }
    );
  }
}