// app/api/reportes/cierre-caja/route.ts

import { NextResponse } from 'next/server';
import { MetodoPago, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getBoliviaDateString() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now); 
}

export async function GET(request: Request) {
  try {
    const fechaHoy = getBoliviaDateString(); 
    
    const inicioDelDia = new Date(`${fechaHoy}T00:00:00.000-04:00`); 
    const finDelDia = new Date(`${fechaHoy}T23:59:59.999-04:00`);

    const totalesVentasPorMetodo = await prisma.venta.groupBy({
      by: ['metodoPago'],
      where: {
        creadoEn: {
          gte: inicioDelDia, 
          lte: finDelDia,     
        },
      },
      _sum: {
        total: true, 
      },
    });

    const anticiposPorMetodo = await prisma.pedido.groupBy({
      by: ['metodoPagoAnticipo'],
      where: {
        creadoEn: {
          gte: inicioDelDia,
          lte: finDelDia,
        },
        anticipo: {
          gt: 0,
        },
      },
      _sum: {
        anticipo: true,
      },
    });

    const reporteFinal = new Map<MetodoPago, number>();
    reporteFinal.set(MetodoPago.EFECTIVO, 0);
    reporteFinal.set(MetodoPago.QR, 0);

    for (const item of totalesVentasPorMetodo) {
      reporteFinal.set(item.metodoPago, (reporteFinal.get(item.metodoPago) || 0) + (item._sum.total || 0));
    }
    
    for (const item of anticiposPorMetodo) {
      const metodo = item.metodoPagoAnticipo;
      const totalAnticipo = item._sum.anticipo || 0;
      reporteFinal.set(metodo, (reporteFinal.get(metodo) || 0) + totalAnticipo);
    }
    
    const reporteFormateado = Array.from(reporteFinal.entries()).map(([metodoPago, total]) => ({
      metodoPago,
      total,
    })).sort((a, b) => a.metodoPago.localeCompare(b.metodoPago));

    const totalGeneralVentas = totalesVentasPorMetodo.reduce((acc, item) => acc + (item._sum.total || 0), 0);
    const totalAnticipos = anticiposPorMetodo.reduce((acc, item) => acc + (item._sum.anticipo || 0), 0);
    const totalGeneral = totalGeneralVentas + totalAnticipos;
    
    const respuesta = {
      totalesPorMetodo: reporteFormateado,
      totalGeneral: totalGeneral,
      fechaReporte: fechaHoy.split('-').reverse().join('/'), 
      desglose: {
        totalVentas: totalGeneralVentas,
        totalAnticipos: totalAnticipos,
      }
    };

    return NextResponse.json(respuesta, { status: 200 });

  } catch (error) {
    console.error("Error al generar el cierre de caja:", error);
    let errorMessage = "Error al generar el reporte";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
