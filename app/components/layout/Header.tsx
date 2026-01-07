// app/components/layout/Header.tsx

"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Role } from "@prisma/client";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { 
  ShoppingCart, 
  Store, 
  ClipboardList, 
  Settings, 
  Package, 
  Users, 
  BarChart3, 
  ScrollText, 
  TrendingUp, 
  Wallet,
  ChevronDown,
  LogOut
} from "lucide-react";

type UserWithRole = { role?: Role };

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [ventasDropdownOpen, setVentasDropdownOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [reportesDropdownOpen, setReportesDropdownOpen] = useState(false);
  
  const ventasRef = useRef<HTMLDivElement>(null);
  const adminRef = useRef<HTMLDivElement>(null);
  const reportesRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ventasRef.current && !ventasRef.current.contains(event.target as Node)) {
        setVentasDropdownOpen(false);
      }
      if (adminRef.current && !adminRef.current.contains(event.target as Node)) {
        setAdminDropdownOpen(false);
      }
      if (reportesRef.current && !reportesRef.current.contains(event.target as Node)) {
        setReportesDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (pathname === "/login") return null;
  if (status === "loading")
    return <header className="bg-white h-[81px] border-b" />;

  if (!session) return null;

  const getButtonClass = (path: string) =>
    pathname.startsWith(path)
      ? "bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md text-sm min-w-[140px] justify-center"
      : "bg-white text-blue-600 border border-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-sm min-w-[140px] justify-center";

  const getDropdownButtonClass = (paths: string[]) => {
    const isActive = paths.some(path => pathname.startsWith(path));
    return isActive
      ? "bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md text-sm flex items-center gap-2 min-w-[140px] justify-center"
      : "bg-white text-blue-600 border border-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-sm flex items-center gap-2 min-w-[140px] justify-center";
  };

  const userRole = (session.user as UserWithRole)?.role;

  return (
    <header className="backdrop-blur-md bg-cyan-100/95 shadow-lg border-b border-cyan-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo y Nombre */}
          <div className="flex items-center space-x-4">
              <Image
                src="/favicon.ico"
                alt="Pepito´s Logo"
                width={50}
                height={50}
                className="rounded-lg"
              />
            <h1 className="text-2xl font-bold text-gray-800">Pepito´s</h1>
          </div>

          {/* Info de Usuario y Navegación */}
          <div className="flex items-center space-x-6">
            {/* Navegación */}
            <nav className="flex space-x-2">
              {/* Dropdown: Ventas */}
              <div className="relative" ref={ventasRef}>
                <button
                  onClick={() => {
                    setVentasDropdownOpen(!ventasDropdownOpen);
                    setAdminDropdownOpen(false);
                    setReportesDropdownOpen(false);
                  }}
                  className={getDropdownButtonClass(["/pos", "/pedidos"])}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Ventas
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${ventasDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {ventasDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 backdrop-blur-lg bg-cyan-50/98 rounded-2xl shadow-2xl border border-cyan-200/50 py-2 z-50">
                    <button
                      onClick={() => {
                        router.push("/pos");
                        setVentasDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200 flex items-center gap-2 ${
                        pathname.startsWith("/pos") ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-700"
                      }`}
                    >
                      <Store className="w-4 h-4" />
                      Punto de Venta
                    </button>
                    <button
                      onClick={() => {
                        router.push("/pedidos");
                        setVentasDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200 flex items-center gap-2 ${
                        pathname.startsWith("/pedidos") ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-700"
                      }`}
                    >
                      <ClipboardList className="w-4 h-4" />
                      Pedidos
                    </button>
                  </div>
                )}
              </div>

              {/* Admin Section */}
              {userRole === Role.ADMIN && (
                <>
                  {/* Dropdown: Administración */}
                  <div className="relative" ref={adminRef}>
                    <button
                      onClick={() => {
                        setAdminDropdownOpen(!adminDropdownOpen);
                        setVentasDropdownOpen(false);
                        setReportesDropdownOpen(false);
                      }}
                      className={getDropdownButtonClass(["/inventario", "/admin/usuarios"])}
                    >
                      <Settings className="w-4 h-4" />
                      Admin
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${adminDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {adminDropdownOpen && (
                      <div className="absolute top-full left-0 mt-2 w-48 backdrop-blur-lg bg-cyan-50/98 rounded-2xl shadow-2xl border border-cyan-200/50 py-2 z-50">
                        <button
                          onClick={() => {
                            router.push("/inventario");
                            setAdminDropdownOpen(false);
                          }}
                           className={`w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200 flex items-center gap-2 ${
                            pathname.startsWith("/inventario") ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-700"
                          }`}
                        >
                          <Package className="w-4 h-4" />
                          Inventario
                        </button>
                        <button
                          onClick={() => {
                            router.push("/admin/usuarios");
                            setAdminDropdownOpen(false);
                          }}
                           className={`w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200 flex items-center gap-2 ${
                            pathname.startsWith("/admin/usuarios") ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-700"
                          }`}
                        >
                          <Users className="w-4 h-4" />
                          Usuarios
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Dropdown: Reportes */}
                  <div className="relative" ref={reportesRef}>
                    <button
                      onClick={() => {
                        setReportesDropdownOpen(!reportesDropdownOpen);
                        setVentasDropdownOpen(false);
                        setAdminDropdownOpen(false);
                      }}
                      className={getDropdownButtonClass(["/historial-ventas", "/reportes"])}
                    >
                      <BarChart3 className="w-4 h-4" />
                      Reportes
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${reportesDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {reportesDropdownOpen && (
                      <div className="absolute top-full left-0 mt-2 w-48 backdrop-blur-lg bg-cyan-50/98 rounded-2xl shadow-2xl border border-cyan-200/50 py-2 z-50">
                        <button
                          onClick={() => {
                            router.push("/historial-ventas");
                            setReportesDropdownOpen(false);
                          }}
                           className={`w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200 flex items-center gap-2 ${
                            pathname.startsWith("/historial-ventas") ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-700"
                          }`}
                        >
                          <ScrollText className="w-4 h-4" />
                          Historial
                        </button>
                        <button
                          onClick={() => {
                            router.push("/reportes");
                            setReportesDropdownOpen(false);
                          }}
                           className={`w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200 flex items-center gap-2 ${
                            pathname.startsWith("/reportes") ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-700"
                          }`}
                        >
                          <TrendingUp className="w-4 h-4" />
                          Dashboard
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Cierre de Caja - Standalone */}
              <button
                onClick={() => router.push("/cierre-caja")}
                className={`${getButtonClass("/cierre-caja")} flex items-center gap-2`}
              >
                <Wallet className="w-4 h-4" />
                Cierre de Caja
              </button>
            </nav>

            {/* Usuario + Cerrar sesión */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <span className="font-semibold text-gray-700 text-sm">
                  {session.user?.name}
                </span>
                <span className="block text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {(session.user as UserWithRole)?.role}
                </span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="bg-red-500 text-white px-3 py-2 rounded-xl font-semibold hover:bg-red-600 transition-all duration-300 text-sm flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

