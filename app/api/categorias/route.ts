import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const categorias = await prisma.categoria.findMany();

    return NextResponse.json(categorias, { status: 200 });
  } catch (error) {
    console.error("Error al obtener las categorías:", error);

    return NextResponse.json(
      { message: "Error al obtener las categorías" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { nombre } = await request.json();

    if (!nombre) {
      return NextResponse.json(
        { message: "El nombre de la categoría es obligatorio" },
        { status: 400 },
      );
    }

    const nuevaCategoria = await prisma.categoria.create({
      data: {
        nombre: nombre,
      },
    });

    return NextResponse.json(nuevaCategoria, { status: 201 });
  } catch (error) {
    console.error("Error al crear la categoría:", error);
    return NextResponse.json(
      { message: "Error al crear la categoría" },
      { status: 500 },
    );
  }
}
