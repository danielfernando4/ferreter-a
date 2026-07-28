import { useState, type FormEvent } from 'react';
import * as api from '../../services/api';
import { Loader2, AlertCircle, Mail, CheckCircle } from 'lucide-react';

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
}

export default function ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Ingresa tu correo electrónico');
      return;
    }
    setIsLoading(true);
    try {
      await api.forgotPassword({ email: email.trim() });
      setSent(true);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar la solicitud';
      setError(msg);
    }
    setIsLoading(false);
  };

  if (sent) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Correo enviado</h2>
        <p className="text-sm text-slate-600 mb-6">
          Si la cuenta existe, recibirás un enlace de recuperación en tu correo electrónico.
        </p>
        <a
          href="/login"
          className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-all shadow-sm text-sm"
        >
          Volver al inicio de sesión
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-xl font-semibold text-slate-900 mb-1">Recuperar contraseña</h2>
        <p className="text-sm text-slate-500">
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@ejemplo.com"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Mail className="h-5 w-5" />
        )}
        {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
      </button>

      <p className="text-center text-sm text-slate-500">
        <a href="/login" className="font-medium text-slate-700 hover:text-slate-900 transition-colors">
          Volver al inicio de sesión
        </a>
      </p>
    </form>
  );
}
