import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import { Store, Lock } from 'lucide-react';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Store className="h-10 w-10 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">Ferretería</h1>
          </div>
          <p className="text-slate-500">Recuperar contraseña</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">¿Olvidaste tu contraseña?</h2>
          </div>
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
