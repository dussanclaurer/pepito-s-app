// app/api/productos/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getToken } from 'next-auth/jwt'; 
import { Role } from '@prisma/client'; 
import { startOfDay, endOfDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

async function isAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  return token && token.role === Role.ADMIN;
}

export async function GET() {
  try {
    // Calcular inicio y fin del día en zona horaria local
    const timeZone = 'America/La_Paz';
    const ahoraLocal = toZonedTime(new Date(), timeZone);
    const inicioDelDiaLocal = startOfDay(ahoraLocal);
    const finDelDiaLocal = endOfDay(ahoraLocal);
    
    // Convertir a UTC para consultas a la base de datos
    const inicioDelDia = fromZonedTime(inicioDelDiaLocal, timeZone);
    const finDelDia = fromZonedTime(finDelDiaLocal, timeZone);

    const productos = await prisma.producto.findMany({
      include: {
        categoria: true,
        ventas: {
          where: {
            venta: {
              creadoEn: {
                gte: inicioDelDia,
                lte: finDelDia,
              },
            },
          },
          select: {
            cantidad: true,
          },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    // Calculate total quantity sold for each product (solo hoy)
    const productosConVentas = productos.map(producto => {
      const cantidadVendida = producto.ventas.reduce((total, venta) => total + venta.cantidad, 0);
      const { ventas, ...productoSinVentas } = producto;
      return {
        ...productoSinVentas,
        cantidadVendida,
      };
    });

    return NextResponse.json(productosConVentas);
  } catch (error) {
    console.error("Error al listar productos:", error);
    return NextResponse.json({ message: "Error al listar productos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ message: 'Acceso Denegado' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { nombre, precio, inventario, categoriaId } = body;

    if (!nombre || !precio || !categoriaId) {
      return NextResponse.json({ message: "Campos 'nombre', 'precio' y 'categoriaId' son requeridos" }, { status: 400 });
    }

    const nuevoProducto = await prisma.producto.create({
      data: {
        nombre,
        precio: parseFloat(precio),
        inventario: parseInt(inventario) || 0,
        categoriaId: parseInt(categoriaId),
      },
    });
    return NextResponse.json(nuevoProducto, { status: 201 });

  } catch (error) {
    console.error("Error al crear producto:", error);
    return NextResponse.json({ message: "Error al crear producto" }, { status: 500 });
  }
}