import { useState, type FormEvent } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import * as api from '../../services/api';
import { Link } from 'react-router-dom';

interface ForgotPasswordFormProps {
  onSuccess: () => void;
}

export function ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Ingrese su correo electrónico');
      return;
    }
    setIsLoading(true);
    try {
      await api.forgotPassword({ email });
      onSuccess();
    } catch {
      setError('Error al procesar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <p className="text-sm text-slate-600">
        Ingrese su correo electrónico registrado y le enviaremos un enlace para restablecer su contraseña.
      </p>

      <div>
        <label htmlFor="reset-email" className="block text-sm font-medium text-slate-700 mb-1.5">
          Correo electrónico
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="reset-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900"
            placeholder="correo@ejemplo.com"
            autoComplete="email"
            disabled={isLoading}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          'Enviar enlace de recuperación'
        )}
      </button>

      <Link
        to="/login"
        className="flex items-center justify-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al inicio de sesión
      </Link>
    </form>
  );
}
