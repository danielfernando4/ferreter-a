import { useState } from 'react';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import { MailCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ForgotPasswordPage() {
  const [emailSent, setEmailSent] = useState(false);

  if (emailSent) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <MailCheck className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Correo enviado</h2>
            <p className="text-sm text-slate-500 mb-6">
              Si el correo ingresado está registrado, recibirás un enlace para restablecer tu contraseña.
            </p>
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-700 hover:underline text-sm"
            >
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <ForgotPasswordForm onSuccess={() => setEmailSent(true)} />
        </div>
      </div>
    </div>
  );
}
