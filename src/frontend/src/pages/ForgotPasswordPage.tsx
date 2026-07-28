import { Link } from 'react-router-dom';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Ferretería</h1>
        <p className="text-slate-500 mt-1">Recuperar contraseña</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 w-full max-w-md">
        <ForgotPasswordForm />
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft size={16} />
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
