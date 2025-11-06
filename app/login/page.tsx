// app/login/page.tsx

import { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-purple-100">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-3 rounded-xl inline-block mb-4">
            <span className="text-white font-bold text-3xl">🍰</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">
            Bienvenido a Pepito&apos;s
          </h1>
          <p className="text-gray-500">Inicia sesión para continuar</p>
        </div>

        <Suspense fallback={<div>Cargando...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}