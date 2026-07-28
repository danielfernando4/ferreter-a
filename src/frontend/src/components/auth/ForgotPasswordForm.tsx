import React, { useState } from 'react';
import { Loader2, Mail, Send } from 'lucide-react';

interface ForgotPasswordFormProps {
  onSuccess: () => void;
  onSubmit: (email: string) => Promise<void>;
}

export default function ForgotPasswordForm({ onSuccess, onSubmit }: ForgotPasswordFormProps) {
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
      await onSubmit(email);
      onSuccess();
    } catch (err: any) {
      setError(err.detail || 'Error al procesar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-blue-100 rounded-xl">
          <Mail className="text-blue-600" size={24} />
        </div>
        <p className="text-sm text-slate-500">
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Correo electrónico
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900"
          disabled={isLoading}
          required
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all font-medium"
      >
        {isLoading ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <Send size={18} />
        )}
        {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
      </button>
    </form>
  );
}
