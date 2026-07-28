import { useState } from 'react';
import { forgotPassword } from '../../services/api';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ForgotPasswordFormProps {
  onSuccess: () => void;
}

export default function ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Ingresa tu correo electrónico');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await forgotPassword({ email });
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al procesar la solicitud';
      setError(message);
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
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Recuperar contraseña</h2>
        <p className="text-sm text-slate-500">
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>
      </div>
      <div>
        <label htmlFor="reset-email" className="block text-sm font-medium text-slate-700 mb-1">
          Correo electrónico
        </label>
        <input
          id="reset-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900"
          placeholder="correo@ejemplo.com"
          autoComplete="email"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
      </button>
      <div className="text-center">
        <Link to="/login" className="text-sm text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Volver al inicio de sesión
        </Link>
      </div>
    </form>
  );
}
