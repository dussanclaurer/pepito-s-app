// app/admin/usuarios/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Role } from '@prisma/client'; 

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export default function AdminUsuariosPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: Role.CAJERO, 
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (!res.ok) {
        throw new Error('No se pudieron cargar los usuarios');
      }
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al crear el usuario');
      }

      setSuccess(`¡Usuario "${data.name}" creado con éxito!`);
      setFormData({ name: '', email: '', password: '', role: Role.CAJERO }); 
      fetchUsers(); 
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      
      {/* --- INICIO: HEADER (Actualizado) --- */}
      <header className="bg-white shadow-lg border-b border-purple-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-2 rounded-lg">
                <span className="text-white font-bold text-xl">🍰</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Pepito´s</h1>
            </div>

            {session && (
              <div className="flex items-center space-x-6">
                <nav className="flex space-x-2">
                  <button onClick={() => router.push('/pos')} className="bg-white text-purple-600 border border-purple-600 px-3 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-colors text-sm">
                    Punto de Venta
                  </button>
                  <button onClick={() => router.push('/pedidos')} className="bg-white text-purple-600 border border-purple-600 px-3 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-colors text-sm">
                    Pedidos
                  </button>
                  
                  {(session?.user as any)?.role === Role.ADMIN && (
                    <>
                      <button onClick={() => router.push('/historial-ventas')} className="bg-white text-purple-600 border border-purple-600 px-3 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-colors text-sm">
                        Historial
                      </button>
                      <button onClick={() => router.push('/inventario')} className="bg-white text-purple-600 border border-purple-600 px-3 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-colors text-sm">
                        Inventario
                      </button>
                      <button onClick={() => router.push('/reportes')} className="bg-white text-purple-600 border border-purple-600 px-3 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-colors text-sm">
                        Reportes
                      </button>
                      <button onClick={() => router.push('/admin/usuarios')} className="bg-purple-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-md text-sm">
                        Usuarios
                      </button>
                    </>
                  )}
                  
                  <button onClick={() => router.push('/cierre-caja')} className="bg-white text-purple-600 border border-purple-600 px-3 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-colors text-sm">
                    Cierre de Caja
                  </button>
                </nav>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span className="font-semibold text-gray-700 text-sm">{session?.user?.name}</span>
                    <span className="block text-xs font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{(session?.user as any)?.role}</span>
                  </div>
                  <button onClick={() => signOut({ callbackUrl: '/login' })} className="bg-red-500 text-white px-3 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors text-sm">
                    Salir
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      {/* --- FIN: HEADER --- */}

      {/* --- Contenido Principal --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Columna 1: Formulario para crear usuario */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-purple-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Crear Nuevo Usuario</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* --- Mensajes de Éxito y Error --- */}
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
                {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre Completo</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña Temporal</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Rol</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value={Role.CAJERO}>Cajero</option>
                    <option value={Role.ADMIN}>Administrador</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold py-3 rounded-xl hover:from-purple-700 hover:to-pink-600 transition-all disabled:from-gray-400"
                >
                  {isSubmitting ? 'Creando...' : 'Crear Usuario'}
                </button>
              </form>
            </div>
          </div>

          {/* Columna 2: Lista de usuarios */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-purple-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Usuarios Existentes</h2>
              
              <div className="max-h-[70vh] overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-purple-200">
                    <thead className="bg-purple-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-purple-800 uppercase tracking-wider">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-purple-800 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-purple-800 uppercase tracking-wider">Rol</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-purple-800 uppercase tracking-wider">Registrado</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map(user => (
                        <tr key={user.id} className="hover:bg-purple-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{user.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === Role.ADMIN ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}