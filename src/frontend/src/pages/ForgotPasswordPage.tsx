import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Recuperar contraseña</h1>
          <p className="text-slate-500 mt-1">
            Ingresa tu correo y te enviaremos un enlace
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
          <ForgotPasswordForm />
        </div>

        <div className="text-center mt-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={16} />
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
