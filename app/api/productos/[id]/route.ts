// app/api/productos/[id]/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { nombre, precio, inventario, categoriaId } = await request.json();

    if (!nombre && !precio && !inventario && !categoriaId) {
      return NextResponse.json(
        { message: "Se requiere al menos un campo para actualizar" },
        { status: 400 }
      );
    }

    const productoActualizado = await prisma.producto.update({
      where: {
        id: parseInt(id), 
      },
      data: {
        nombre,
        precio: precio ? parseFloat(precio) : undefined,
        inventario: inventario ? parseInt(inventario) : undefined,
        categoriaId: categoriaId ? parseInt(categoriaId) : undefined,
      },
    });

    return NextResponse.json(productoActualizado, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar el producto:", error);
    return NextResponse.json(
      { message: "Error al actualizar el producto" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const productoEliminado = await prisma.producto.delete({
      where: {
        id: parseInt(id), 
      },
    });

    return NextResponse.json(productoEliminado, { status: 200 });
  } catch (error) {
    console.error("Error al eliminar el producto:", error);
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
       return NextResponse.json({ message: "Producto no encontrado" }, { status: 404 });
    }
    return NextResponse.json(
      { message: "Error al eliminar el producto" },
      { status: 500 }
    );
  }
}