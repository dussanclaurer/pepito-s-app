// app/api/productos/[id]/route.ts

import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getToken } from 'next-auth/jwt';
import { Role } from '@prisma/client';

async function isAdmin(req: Request | NextRequest) {
  const token = await getToken({ req: req as unknown as NextRequest, secret: process.env.NEXTAUTH_SECRET });
  return token && token.role === Role.ADMIN;
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ message: 'Acceso Denegado' }, { status: 403 });
  }
  
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { nombre, precio, inventario, categoriaId } = body;

    const productoActualizado = await prisma.producto.update({
      where: { id },
      data: {
        nombre,
        precio: parseFloat(precio),
        inventario: parseInt(inventario),
        categoriaId: parseInt(categoriaId),
      },
    });
    return NextResponse.json(productoActualizado);
  } catch (error) {
    console.error(`Error al actualizar producto ${params.id}:`, error);
    return NextResponse.json({ message: "Error al actualizar producto" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ message: 'Acceso Denado' }, { status: 403 });
  }

  try {
    const id = parseInt(params.id);
    await prisma.producto.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Producto eliminado" }, { status: 200 });
  } catch (error) {
    console.error(`Error al eliminar producto ${params.id}:`, error);
    return NextResponse.json({ message: "Error al eliminar producto" }, { status: 500 });
  }
}