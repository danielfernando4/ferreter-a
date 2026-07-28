import { useState } from 'react';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import { Store } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [emailSent, setEmailSent] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Recuperar contraseña</h1>
          <p className="text-sm text-slate-500 mt-1">
            {emailSent
              ? 'Revisa tu bandeja de entrada'
              : 'Te enviaremos un enlace para restablecer tu contraseña'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <ForgotPasswordForm onSuccess={() => setEmailSent(true)} />
        </div>
      </div>
    </div>
  );
}
