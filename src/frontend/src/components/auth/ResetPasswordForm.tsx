import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../services/api';
import { ApiError } from '../../services/api';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface ResetPasswordFormProps {
  token: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        await api.verifyResetToken(token);
        setIsVerifying(false);
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.status === 410) {
            setTokenError('El enlace de recuperación ha expirado. Solicita uno nuevo.');
          } else {
            setTokenError('El enlace de recuperación no es válido.');
          }
        } else {
          setTokenError('Error al verificar el enlace.');
        }
        setIsVerifying(false);
      }
    };
    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await api.resetPassword({ token, new_password: newPassword, confirm_password: confirmPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Error al restablecer la contraseña.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="text-center py-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {tokenError}
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 size={28} className="text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Contraseña actualizada</h3>
        <p className="text-sm text-slate-500">Redirigiendo al inicio de sesión...</p>
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
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Nueva contraseña</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
            minLength={6}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirmar contraseña</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repite la contraseña"
          required
          className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 ${
            confirmPassword && newPassword !== confirmPassword ? 'border-red-400' : 'border-slate-300'
          }`}
        />
        {confirmPassword && newPassword !== confirmPassword && (
          <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
      >
        {isLoading ? <Loader2 size={20} className="animate-spin" /> : null}
        {isLoading ? 'Guardando...' : 'Restablecer contraseña'}
      </button>
    </form>
  );
}
