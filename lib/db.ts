import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// A partir de ahora, en todos tus archivos de API (ventas, productos, etc.)
// deberías importar 'prisma' desde este archivo:
// import { prisma } from '@/lib/db';
// en lugar de hacer 'new PrismaClient()'
