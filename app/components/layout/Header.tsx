// app/components/layout/Header.tsx

"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Role } from "@prisma/client";

type UserWithRole = { role?: Role };

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (pathname === "/login") return null;
  if (status === "loading")
    return <header className="bg-white h-[81px] border-b" />;

  if (!session) return null;

  const getButtonClass = (path: string) =>
    pathname.startsWith(path)
      ? "bg-purple-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-md text-sm"
      : "bg-white text-purple-600 border border-purple-600 px-3 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-colors text-sm";

  const userRole = (session.user as UserWithRole)?.role;

  return (
    <header className="bg-white shadow-lg border-b border-purple-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo y Nombre */}
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-2 rounded-lg">
              <span className="text-white font-bold text-xl">🍰</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Pepito´s</h1>
          </div>

          {/* Info de Usuario y Navegación */}
          <div className="flex items-center space-x-6">
            {/* Navegación */}
            <nav className="flex space-x-2">
              <button
                onClick={() => router.push("/pos")}
                className={getButtonClass("/pos")}
              >
                Punto de Venta
              </button>
              <button
                onClick={() => router.push("/pedidos")}
                className={getButtonClass("/pedidos")}
              >
                Pedidos
              </button>

              {userRole === Role.ADMIN && (
                <>
                  <button
                    onClick={() => router.push("/historial-ventas")}
                    className={getButtonClass("/historial-ventas")}
                  >
                    Historial
                  </button>
                  <button
                    onClick={() => router.push("/inventario")}
                    className={getButtonClass("/inventario")}
                  >
                    Inventario
                  </button>
                  <button
                    onClick={() => router.push("/reportes")}
                    className={getButtonClass("/reportes")}
                  >
                    Reportes
                  </button>
                  <button
                    onClick={() => router.push("/admin/usuarios")}
                    className={getButtonClass("/admin/usuarios")}
                  >
                    Usuarios
                  </button>
                </>
              )}

              <button
                onClick={() => router.push("/cierre-caja")}
                className={getButtonClass("/cierre-caja")}
              >
                Cierre de Caja
              </button>
            </nav>

            {/* Usuario + Cerrar sesión */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <span className="font-semibold text-gray-700 text-sm">
                  {session.user?.name}
                </span>
                <span className="block text-xs font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  {(session.user as UserWithRole)?.role}
                </span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="bg-red-500 text-white px-3 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors text-sm"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
