import { useState } from 'react';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  const [emailSent, setEmailSent] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          {emailSent ? (
            <div className="text-center">
              <div className="mx-auto w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="text-green-600" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Correo enviado</h2>
              <p className="text-sm text-slate-500 mb-6">
                Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.
              </p>
              <a
                href="/login"
                className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all"
              >
                Volver al inicio de sesión
              </a>
            </div>
          ) : (
            <ForgotPasswordForm onSuccess={() => setEmailSent(true)} />
          )}
        </div>
      </div>
    </div>
  );
}
