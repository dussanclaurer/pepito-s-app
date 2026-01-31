// app/api/productos/[id]/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getToken } from "next-auth/jwt";
import { Role } from "@prisma/client";

async function isAdmin(req: Request | NextRequest) {
  const token = await getToken({
    req: req as unknown as NextRequest,
    secret: process.env.NEXTAUTH_SECRET,
  });
  return token?.role === Role.ADMIN;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ message: "Acceso Denegado" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const productoId = parseInt(id, 10);
    if (Number.isNaN(productoId))
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });

    const body = await request.json();
    const { nombre, precio, inventario, categoriaId } = body;

    const actualizado = await prisma.producto.update({
      where: { id: productoId },
      data: {
        nombre,
        precio: parseFloat(precio),
        inventario: parseInt(inventario, 10),
        categoriaId: parseInt(categoriaId, 10),
      },
    });

    return NextResponse.json(actualizado);
  } catch (e) {
    console.error("Error actualizando producto:", e);
    return NextResponse.json(
      { message: "Error al actualizar producto" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ message: "Acceso Denegado" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const productoId = parseInt(id, 10);
    if (Number.isNaN(productoId))
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });

    // Soft delete: marcar como inactivo en lugar de eliminar
    await prisma.producto.update({
      where: { id: productoId },
      data: { activo: false },
    });

    return NextResponse.json({ message: "Producto desactivado exitosamente" });
  } catch (e) {
    console.error("Error desactivando producto:", e);
    return NextResponse.json(
      { message: "Error al desactivar producto" },
      { status: 500 },
    );
  }
}
