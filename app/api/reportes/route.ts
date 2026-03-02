// app/api/reportes/route.ts

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  subWeeks,
  subMonths,
  format,
} from "date-fns";
import { es } from "date-fns/locale";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { NextRequest } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get("periodo") || "dia";
    const offset = parseInt(searchParams.get("offset") || "0"); // 0 = actual, -1 = anterior, etc.
    const umbralInventario = parseInt(searchParams.get("umbral") || "5");
    const timeZone = "America/La_Paz";

    const now = new Date();
    // Fecha "base" en zona horaria de Bolivia
    let zonedBase = toZonedTime(now, timeZone);

    // Desplazar la fecha base según el offset y el periodo
    if (offset !== 0) {
      switch (periodo) {
        case "semana":
          zonedBase = subWeeks(zonedBase, Math.abs(offset));
          break;
        case "mes":
          zonedBase = subMonths(zonedBase, Math.abs(offset));
          break;
        case "dia":
        default:
          zonedBase = subDays(zonedBase, Math.abs(offset));
          break;
      }
    }

    // Calcular inicio y fin del período en hora Bolivia
    // FIX: weekStartsOn: 1 = Lunes (estándar Bolivia/latinoamérica)
    let fechaInicioLocal: Date;
    let fechaFinLocal: Date;

    switch (periodo) {
      case "semana":
        fechaInicioLocal = startOfWeek(zonedBase, { weekStartsOn: 1 });
        fechaFinLocal = endOfWeek(zonedBase, { weekStartsOn: 1 });
        break;
      case "mes":
        fechaInicioLocal = startOfMonth(zonedBase);
        fechaFinLocal = endOfMonth(zonedBase);
        break;
      case "dia":
      default:
        fechaInicioLocal = startOfDay(zonedBase);
        fechaFinLocal = endOfDay(zonedBase);
        break;
    }

    // Convertir de hora Bolivia a UTC para consultas a la DB
    const fechaInicio = fromZonedTime(fechaInicioLocal, timeZone);
    const fechaFin = fromZonedTime(fechaFinLocal, timeZone);

    // Labels para mostrar en la UI
    const labelFormato =
      periodo === "dia"
        ? "EEEE d 'de' MMMM yyyy"
        : periodo === "semana"
          ? "d MMM"
          : "MMMM yyyy";

    const fechaInicioLabel = format(fechaInicioLocal, labelFormato, {
      locale: es,
    });
    const fechaFinLabel =
      periodo === "dia"
        ? null
        : format(fechaFinLocal, labelFormato, { locale: es });

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
        activo: true,
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
        offset: offset,
        fechaInicioLabel,
        fechaFinLabel,
        // Pasar ISO para que el frontend las reenvíe al endpoint de ranking
        fechaInicioISO: fechaInicio.toISOString(),
        fechaFinISO: fechaFin.toISOString(),
      },
      alertaInventario: inventarioBajo,
    };

    return NextResponse.json(resultado, { status: 200 });
  } catch (error) {
    console.error("Error al generar reportes:", error);
    return NextResponse.json(
      { message: "Error al generar los reportes" },
      { status: 500 },
    );
  }
}
