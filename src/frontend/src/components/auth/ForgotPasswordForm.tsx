import { useState } from 'react';
import * as api from '../../services/api';
import { Loader2, Mail } from 'lucide-react';

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
    setError('');
    setIsLoading(true);
    try {
      await api.forgotPassword({ email });
      setSent(true);
      onSuccess?.();
    } catch {
      setError('Error al procesar la solicitud. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail size={28} className="text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Correo enviado</h3>
        <p className="text-sm text-slate-500">
          Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="reset-email" className="block text-sm font-medium text-slate-700 mb-1.5">
          Correo electrónico
        </label>
        <input
          id="reset-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@ejemplo.com"
          required
          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
      >
        {isLoading ? <Loader2 size={20} className="animate-spin" /> : null}
        {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
      </button>
    </form>
  );
}
