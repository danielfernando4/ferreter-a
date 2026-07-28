import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../services/api';
import { Loader2, AlertCircle, Check, Lock } from 'lucide-react';

interface ResetPasswordFormProps {
  token: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function verify() {
      try {
        const res = await api.verifyResetToken(token);
        if (res.valido) {
          setTokenValid(true);
        } else {
          setTokenError('El token no es válido');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Token inválido o expirado';
        setTokenError(msg);
      }
      setIsVerifying(false);
    }
    verify();
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!newPassword || newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setIsLoading(true);
    try {
      await api.resetPassword({ token, new_password: newPassword, confirm_password: confirmPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al restablecer la contraseña';
      setError(msg);
    }
    setIsLoading(false);
  };

  if (isVerifying) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          <p className="text-sm text-slate-500">Verificando token...</p>
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Token inválido</h2>
        <p className="text-sm text-slate-600 mb-6">{tokenError}</p>
        <a
          href="/forgot-password"
          className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-all shadow-sm text-sm"
        >
          Solicitar nuevo enlace
        </a>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="h-6 w-6 text-green-600" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Contraseña actualizada</h2>
        <p className="text-sm text-slate-600">Redirigiendo al inicio de sesión...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-2">
        <div className="flex justify-center mb-3">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
            <Lock className="h-6 w-6 text-slate-700" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-1">Restablecer contraseña</h2>
        <p className="text-sm text-slate-500">Ingresa tu nueva contraseña</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
          Nueva contraseña
        </label>
        <input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
          Confirmar contraseña
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
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
          <Check className="h-5 w-5" />
        )}
        {isLoading ? 'Guardando...' : 'Restablecer contraseña'}
      </button>
    </form>
  );
}
