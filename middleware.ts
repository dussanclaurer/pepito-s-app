import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  const isAuth = !!token;
  const isPublicPath = pathname === '/login';

  if (isAuth && isPublicPath) {
    return NextResponse.redirect(new URL('/pos', req.url));
  }

  if (!isAuth && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isAuth && !isPublicPath) {
    const userRole = token.role as string;

    const adminRoutes = [
      '/inventario',      // Página de inventario
      '/reportes',        // Página de reportes
      '/historial-ventas',// Página de historial
      '/api/productos',   // API de productos (CRUD)
      '/api/categorias',  // API de categorías
      '/api/reportes',    // API de reportes
      '/api/historial-ventas', // API de historial
    ];

    const isCajero = userRole === 'CAJERO';
    const accessingAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

    if (isCajero && accessingAdminRoute) {
      
      if (pathname.startsWith('/api')) {
        return NextResponse.json({ message: 'Acceso Denegado' }, { status: 403 });
      }
      
      return NextResponse.redirect(new URL('/pos', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (Rutas de API de Next-Auth para loguearse)
     * - _next/static (Static files)
     * - _next/image (Image optimization files)
     * - favicon.ico (Favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
