import { useState } from 'react';
import { authApi } from '../../services/api';
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
}

export default function ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Ingresa tu correo electrónico.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await authApi.forgotPassword({ email: email.trim() });
      setSent(true);
      onSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al procesar la solicitud';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Correo Enviado</h2>
        <p className="text-sm text-slate-600">
          Si el correo ingresado está registrado, recibirás un enlace para restablecer tu contraseña.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-4">
        <Mail className="h-12 w-12 text-indigo-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Recuperar Contraseña</h2>
        <p className="text-sm text-slate-500 mt-1">
          Ingresa tu correo y te enviaremos un enlace de recuperación.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Correo Electrónico
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
          placeholder="tu@correo.com"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          'Enviar Enlace'
        )}
      </button>
    </form>
  );
}
