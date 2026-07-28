import { useState } from 'react';
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';

export function ForgotPasswordPage() {
  const [emailSent, setEmailSent] = useState(false);

  if (emailSent) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Correo enviado</h2>
            <p className="text-sm text-slate-500 mb-6">
              Si la cuenta existe, recibirá un enlace de recuperación en su correo electrónico.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-4">
            <Mail className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Recuperar contraseña</h1>
          <p className="text-slate-500 mt-1">Le enviaremos un enlace de restablecimiento</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
          <ForgotPasswordForm onSuccess={() => setEmailSent(true)} />
        </div>
      </div>
    </div>
  );
}
