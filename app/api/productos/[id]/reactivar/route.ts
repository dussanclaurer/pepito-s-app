// app/api/productos/[id]/reactivar/route.ts

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

    // Reactivar el producto
    await prisma.producto.update({
      where: { id: productoId },
      data: { activo: true },
    });

    return NextResponse.json({ message: "Producto reactivado exitosamente" });
  } catch (e) {
    console.error("Error reactivando producto:", e);
    return NextResponse.json(
      { message: "Error al reactivar producto" },
      { status: 500 },
    );
  }
}
