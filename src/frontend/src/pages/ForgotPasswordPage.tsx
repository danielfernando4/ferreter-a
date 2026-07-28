import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import { Building, ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [emailSent, setEmailSent] = useState(false);

  if (emailSent) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center">
            <div className="p-3 rounded-full bg-blue-100 w-fit mx-auto mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Correo enviado</h2>
            <p className="text-sm text-slate-500 mb-6">
              Si el correo ingresado está registrado, recibirás un enlace para restablecer tu contraseña.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          <h2 className="text-xl font-semibold text-slate-900 mb-1">Recuperar contraseña</h2>
          <p className="text-sm text-slate-500 mb-6">
            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
          </p>
          <ForgotPasswordForm onSuccess={() => setEmailSent(true)} />
        </div>
      </div>
    </div>
  );
}
