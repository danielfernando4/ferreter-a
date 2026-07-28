import { useState } from 'react';
import { Link } from 'react-router-dom';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import { forgotPasswordApi } from '../services/api';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (email: string) => {
    await forgotPasswordApi({ email });
  };

  const handleSuccess = () => {
    setEmailSent(true);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Correo enviado
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Si el correo ingresado está registrado, recibirás un enlace para restablecer tu contraseña.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Mail className="text-blue-600" size={32} />
          <h1 className="text-2xl font-bold text-slate-900">Ferretería</h1>
        </div>
        <p className="text-slate-500">Recuperar contraseña</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <ForgotPasswordForm onSubmit={handleSubmit} onSuccess={handleSuccess} />

        <div className="mt-4 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-all"
          >
            <ArrowLeft size={14} />
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
