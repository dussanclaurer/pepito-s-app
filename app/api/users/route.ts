// app/api/users/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db'; 
import bcrypt from 'bcryptjs';
import { getToken } from 'next-auth/jwt';
import { Role } from '@prisma/client';

async function isAdmin(req: Request) {
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
  return token && token.role === Role.ADMIN;
}

export async function GET(request: Request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ message: 'Acceso Denegado' }, { status: 403 });
  }

    try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return NextResponse.json({ message: "Error al obtener la lista de usuarios" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ message: 'Acceso Denegado' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { email, password, name, role } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json({ message: "Todos los campos son requeridos" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: "El email ya está en uso" }, { status: 409 }); // 409 Conflict
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
      select: { 
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    return NextResponse.json(user, { status: 201 });

  } catch (error) {
    console.error("Error al crear usuario:", error);
    return NextResponse.json({ message: "Error al crear el usuario" }, { status: 500 });
  }
}