import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyResetToken, resetPassword } from '../../services/api';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface ResetPasswordFormProps {
  token: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const verify = async () => {
      try {
        const result = await verifyResetToken(token);
        if (result.valido) {
          setTokenValid(true);
          setEmail(result.email);
        } else {
          setError('El enlace de recuperación no es válido o ha expirado.');
        }
      } catch {
        setError('El enlace de recuperación no es válido o ha expirado.');
      } finally {
        setVerifying(false);
      }
    };
    verify();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Todos los campos son obligatorios');
      return;
    }
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await resetPassword({ token, new_password: newPassword, confirm_password: confirmPassword });
      navigate('/login', { state: { passwordReset: true } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al restablecer la contraseña';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500">Verificando enlace de recuperación...</p>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="text-center py-12">
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
          {error}
        </div>
        <button
          onClick={() => navigate('/forgot-password')}
          className="text-blue-600 hover:text-blue-700 hover:underline text-sm"
        >
          Solicitar un nuevo enlace
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Restablecer contraseña</h2>
        <p className="text-sm text-slate-500">
          Ingresa tu nueva contraseña para la cuenta <strong>{email}</strong>
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nueva contraseña</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 pr-10"
            placeholder="Mínimo 6 caracteres"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar nueva contraseña</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
          placeholder="Repite la contraseña"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {isLoading ? 'Guardando...' : 'Restablecer contraseña'}
      </button>
    </form>
  );
}
