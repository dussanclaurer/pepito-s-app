// app/api/reportes/cierre-caja/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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

    const totalesPorMetodo = await prisma.venta.groupBy({
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
      orderBy: {
        metodoPago: 'asc',
      },
    });

    const totalGeneral = await prisma.venta.aggregate({
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

    const reporteFormateado = totalesPorMetodo.map(item => ({
      metodoPago: item.metodoPago,
      total: item._sum.total || 0,
    }));

    if (!reporteFormateado.find(r => r.metodoPago === 'EFECTIVO')) {
      reporteFormateado.push({ metodoPago: 'EFECTIVO', total: 0 });
    }
    if (!reporteFormateado.find(r => r.metodoPago === 'QR')) {
      reporteFormateado.push({ metodoPago: 'QR', total: 0 });
    }
    
    const respuesta = {
      totalesPorMetodo: reporteFormateado.sort((a, b) => a.metodoPago.localeCompare(b.metodoPago)),
      totalGeneral: totalGeneral._sum.total || 0,
      fechaReporte: fechaHoy.split('-').reverse().join('/'), 
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
