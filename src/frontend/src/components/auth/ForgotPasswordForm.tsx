import { useState } from 'react';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import { forgotPassword } from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
}

export function ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await forgotPassword({ email });
      setSent(true);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Error al procesar solicitud');
      } else {
        setError('Error al procesar solicitud');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
          <Mail size={32} className="text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Correo Enviado</h3>
        <p className="text-slate-500 text-sm">
          Si el correo ingresado está registrado, recibirás un enlace para restablecer tu contraseña.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 justify-center mx-auto text-blue-600 hover:text-blue-700 font-medium text-sm"
        >
          <ArrowLeft size={18} />
          Volver al inicio de sesión
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-2xl text-sm">{error}</div>
      )}

      <div>
        <label htmlFor="reset-email" className="block text-sm font-medium text-slate-700 mb-1.5">
          Correo Electrónico
        </label>
        <div className="relative">
          <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="reset-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            required
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-2xl shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
      >
        {isLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Mail size={18} />
        )}
        {isLoading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Volver al inicio de sesión
        </button>
      </div>
    </form>
  );
}
