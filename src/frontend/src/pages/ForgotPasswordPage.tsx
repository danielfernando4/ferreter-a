import { useState } from 'react';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import { Mail, Store, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [emailSent, setEmailSent] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 text-white mb-4">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Ferretería</h1>
          <p className="text-sm text-slate-500 mt-1">Recuperar contraseña</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          {emailSent ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Correo enviado</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Si el correo está registrado, recibirás un enlace de recuperación.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-5">
                <Mail className="w-5 h-5 text-slate-400" />
                <p className="text-sm text-slate-600">
                  Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
                </p>
              </div>
              <ForgotPasswordForm onSuccess={() => setEmailSent(true)} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
