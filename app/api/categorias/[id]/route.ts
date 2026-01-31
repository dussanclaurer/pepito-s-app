// app/api/categorias/[id]/route.ts

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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ message: "Acceso Denegado" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const categoriaId = parseInt(id, 10);
    if (Number.isNaN(categoriaId))
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });

    // Verificar si la categoría tiene productos asociados
    const productosAsociados = await prisma.producto.count({
      where: { categoriaId: categoriaId },
    });

    if (productosAsociados > 0) {
      return NextResponse.json(
        {
          message: `No se puede eliminar la categoría porque tiene ${productosAsociados} producto${productosAsociados > 1 ? "s" : ""} asociado${productosAsociados > 1 ? "s" : ""}`,
        },
        { status: 400 },
      );
    }

    await prisma.categoria.delete({ where: { id: categoriaId } });
    return NextResponse.json({ message: "Categoría eliminada exitosamente" });
  } catch (e) {
    console.error("Error eliminando categoría:", e);
    return NextResponse.json(
      { message: "Error al eliminar categoría" },
      { status: 500 },
    );
  }
}
