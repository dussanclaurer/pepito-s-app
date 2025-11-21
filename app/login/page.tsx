// app/login/page.tsx

import { Suspense } from 'react';
import LoginForm from './LoginForm';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-red-50">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-blue-100">
        <div className="text-center mb-8">
          <div className="rounded-xl inline-block mb-4">
            <Image
              src="/favicon.ico"
              alt="Pepito's Logo"
              width={94}
              height={94}
              className="rounded-lg"
            />
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
