import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      include: {
        categoria: true,
      },
    });
    return NextResponse.json(productos, { status: 200 });
  } catch (error) {
    console.error("Error al obtener los productos:", error);
    return NextResponse.json(
      { message: "Error al obtener los productos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { nombre, precio, inventario, categoriaId } = await request.json();

    if (!nombre || !precio || !categoriaId) {
      return NextResponse.json(
        { message: "Nombre, precio y categoría son obligatorios" },
        { status: 400 }
      );
    }

    const nuevoProducto = await prisma.producto.create({
      data: {
        nombre: nombre,
        precio: parseFloat(precio), 
        inventario: parseInt(inventario) || 0, 
        categoriaId: parseInt(categoriaId),
      },
    });

    return NextResponse.json(nuevoProducto, { status: 201 });

  } catch (error) {
    console.error("Error al crear el producto:", error);
    return NextResponse.json(
      { message: "Error al crear el producto" },
      { status: 500 }
    );
  }
}