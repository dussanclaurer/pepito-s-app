// app/api/reportes/mas-vendidos/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const productosAgrupados = await prisma.ventaProducto.groupBy({
      by: ['productoId'], 
      _sum: {
        cantidad: true, 
        precioUnitario: true, 
      },
      _count: {
        productoId: true, 
      },
    });
    
    const productoIds = productosAgrupados.map(p => p.productoId);
    const productos = await prisma.producto.findMany({
      where: { id: { in: productoIds } },
      select: { id: true, nombre: true, precio: true },
    });
    const productosMap = new Map(productos.map(p => [p.id, p]));

    const ranking = productosAgrupados.map(p => {
        const productoInfo = productosMap.get(p.productoId);
        const cantidadTotal = p._sum.cantidad || 0;
        const ingresoTotal = (productoInfo?.precio || 0) * cantidadTotal;

        return {
            productoId: p.productoId,
            nombre: productoInfo?.nombre || 'Producto no encontrado',
            cantidadVendida: cantidadTotal,
            ingresoGenerado: ingresoTotal,
        }
    });

    const rankingPorCantidad = [...ranking].sort((a, b) => b.cantidadVendida - a.cantidadVendida);
    const rankingPorIngresos = [...ranking].sort((a, b) => b.ingresoGenerado - a.ingresoGenerado);

    return NextResponse.json({ rankingPorCantidad, rankingPorIngresos }, { status: 200 });

  } catch (error) {
    console.error("Error al generar ranking de productos:", error);
    return NextResponse.json(
      { message: "Error al generar ranking de productos" },
      { status: 500 }
    );
  }
}