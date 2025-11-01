// app/api/historial-ventas/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getStartOfDayBOL = (date: Date): Date => {
  date.setUTCHours(-4, 0, 0, 0);
  return date;
};

const getStartOfWeekBOL = (date: Date): Date => {
  const d = new Date(date);
  d.setUTCHours(-4, 0, 0, 0);
  const day = d.getUTCDay(); 
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); 
  return new Date(d.setUTCDate(diff));
};

const getStartOfMonthBOL = (date: Date): Date => {
  const d = new Date(date);
  d.setUTCHours(-4, 0, 0, 0);
  d.setUTCDate(1);
  return d;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const periodo = searchParams.get('periodo') || 'dia'; 

  const ahoraBOL = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/La_Paz' }));

  let fechaInicio: Date;
  let fechaFin: Date = new Date(ahoraBOL); 
  fechaFin.setUTCHours(19, 59, 59, 999); 
  fechaFin.setUTCHours(23 - 4, 59, 59, 999); 

  switch (periodo) {
    case 'semana':
      fechaInicio = getStartOfWeekBOL(ahoraBOL);
      break;
    case 'mes':
      fechaInicio = getStartOfMonthBOL(ahoraBOL);
      break;
    case 'dia':
    default:
      fechaInicio = getStartOfDayBOL(ahoraBOL);
      break;
  }

  try {
    const ventas = await prisma.venta.findMany({
      where: {
        creadoEn: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
      include: {
        productosVendidos: { 
          include: {
            producto: {
              select: { nombre: true }, 
            },
          },
        },
      },
      orderBy: {
        creadoEn: 'desc', 
      },
    });

    return NextResponse.json(ventas as any);
  } catch (error) {
    console.error("Error al obtener historial de ventas:", error);
    return NextResponse.json({ message: "Error al obtener el historial de ventas" }, { status: 500 });
  }
}