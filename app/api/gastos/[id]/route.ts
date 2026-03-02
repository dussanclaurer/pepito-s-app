// app/api/gastos/[id]/route.ts

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Solo los administradores pueden eliminar gastos" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const gastoId = parseInt(id);

    if (isNaN(gastoId)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });
    }

    const gasto = await prisma.gasto.findUnique({ where: { id: gastoId } });
    if (!gasto) {
      return NextResponse.json(
        { message: "Gasto no encontrado" },
        { status: 404 },
      );
    }

    await prisma.gasto.delete({ where: { id: gastoId } });

    return NextResponse.json(
      { message: "Gasto eliminado correctamente" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error al eliminar gasto:", error);
    return NextResponse.json(
      { message: "Error al eliminar el gasto" },
      { status: 500 },
    );
  }
}
