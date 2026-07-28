import { useState } from 'react';
import * as api from '../../services/api';
import { Mail, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
}

export default function ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.forgotPassword({ email });
      setEmailSent(true);
      onSuccess?.();
    } catch {
      setError('Error al procesar la solicitud. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
          <Mail className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Correo enviado</h2>
        <p className="text-sm text-slate-500">
          Si el correo ingresado está registrado, recibirás un enlace para restablecer tu contraseña.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Volver al inicio de sesión
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <p className="text-sm text-slate-500">
        Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
      </p>

      <div>
        <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-700 mb-1.5">
          Correo electrónico
        </label>
        <input
          id="forgot-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@ejemplo.com"
          required
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-all"
      >
        {isLoading ? (
          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Mail className="h-4 w-4" />
            Enviar enlace
          </>
        )}
      </button>

      <button
        type="button"
        onClick={() => navigate('/login')}
        className="w-full flex items-center justify-center gap-1.5 text-sm text-slate-600 hover:text-slate-800 font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al inicio de sesión
      </button>
    </form>
  );
}
