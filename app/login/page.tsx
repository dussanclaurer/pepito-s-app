// app/login/page.tsx

'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const callbackError = searchParams.get('error');
  if (callbackError && !error) {
    setError('Credenciales incorrectas. Por favor, inténtalo de nuevo.');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false, 
        email,
        password,
      });

      if (result?.error) {
        setError('Credenciales incorrectas. Por favor, inténtalo de nuevo.');
        setLoading(false);
      } else if (result?.ok) {
        router.push('/pos');
        router.refresh(); 
      }
    } catch (err) {
      console.error(err);
      setError('Ocurrió un error inesperado. Inténtalo más tarde.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-purple-100">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-3 rounded-xl inline-block mb-4">
            <span className="text-white font-bold text-3xl">🍰</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Bienvenido a Pepito's</h1>
          <p className="text-gray-500">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* --- Mensaje de Error --- */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-center animate-shake">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="admin@pepitos.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold py-3 px-4 rounded-xl hover:from-purple-700 hover:to-pink-600 transition-all duration-300 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
