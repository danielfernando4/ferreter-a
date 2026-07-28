import LoginForm from '../components/auth/LoginForm';
import { Building } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-blue-600 text-white">
          <Building className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Ferretería</h1>
      </div>

      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-1">Iniciar sesión</h2>
          <p className="text-sm text-slate-500 mb-6">Ingresa tus credenciales para acceder al sistema.</p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
