// app/api/productos/[id]/imagen/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getToken } from "next-auth/jwt";
import { Role } from "@prisma/client";

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

async function isAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  return token?.role === Role.ADMIN;
}

export async function POST(
  request: NextRequest,
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

    const formData = await request.formData();
    const file = formData.get("imagen") as File | null;

    if (!file) {
      return NextResponse.json(
        { message: "No se recibió ninguna imagen" },
        { status: 400 },
      );
    }

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { message: "El archivo debe ser una imagen (JPG, PNG, WEBP, etc.)" },
        { status: 400 },
      );
    }

    // Validar tamaño
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { message: "La imagen no debe superar 2MB" },
        { status: 400 },
      );
    }

    // Convertir a base64 Data URL
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    const actualizado = await prisma.producto.update({
      where: { id: productoId },
      data: { imagenUrl: dataUrl },
      select: { id: true, imagenUrl: true },
    });

    return NextResponse.json(actualizado, { status: 200 });
  } catch (error) {
    console.error("Error al guardar imagen:", error);
    return NextResponse.json(
      { message: "Error al guardar la imagen" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
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

    await prisma.producto.update({
      where: { id: productoId },
      data: { imagenUrl: null },
    });

    return NextResponse.json(
      { message: "Imagen eliminada correctamente" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error al eliminar imagen:", error);
    return NextResponse.json(
      { message: "Error al eliminar la imagen" },
      { status: 500 },
    );
  }
}
