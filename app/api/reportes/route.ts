// app/api/reportes/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || 'dia'; 
    const umbralInventario = parseInt(searchParams.get('umbral') || '5');

    let fechaInicio = new Date();
    fechaInicio.setHours(0, 0, 0, 0);

    if (periodo === 'semana') {
      const diaSemana = fechaInicio.getDay(); 
      const diff = fechaInicio.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1); 
      fechaInicio.setDate(diff);
    } else if (periodo === 'mes') {
      fechaInicio.setDate(1); 
    }

    const resumenVentas = await prisma.venta.aggregate({
      where: {
        creadoEn: {
          gte: fechaInicio,
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
            }
        },
        orderBy: {
            inventario: 'asc', 
        }
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