import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm';
import { Store } from 'lucide-react';

export function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="bg-blue-600 rounded-2xl p-3 inline-flex mb-4 shadow-lg">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Ferretería</h1>
          <p className="text-sm text-slate-500 mt-1">Recuperar contraseña</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
