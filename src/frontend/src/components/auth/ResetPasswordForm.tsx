import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as api from '../../services/api';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function ResetPasswordForm() {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token no proporcionado');
      setIsVerifying(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await api.verifyResetToken(token);
        if (res.valido) {
          setTokenValid(true);
        } else {
          setError('El enlace de recuperación no es válido o ha expirado.');
        }
      } catch {
        setError('El enlace de recuperación no es válido o ha expirado.');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      await api.resetPassword({
        token: token!,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Error al restablecer la contraseña');
      } else {
        setError('Error al restablecer la contraseña');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!tokenValid && error) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
          <Lock className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Enlace inválido</h2>
        <p className="text-sm text-slate-500">{error}</p>
        <button
          onClick={() => navigate('/login')}
          className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Volver al inicio de sesión
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Contraseña actualizada</h2>
        <p className="text-sm text-slate-500">
          Tu contraseña se ha restablecido exitosamente.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="mt-4 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all"
        >
          Iniciar sesión
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <p className="text-sm text-slate-500">
        Ingresa tu nueva contraseña.
      </p>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Nueva contraseña
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
            className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Confirmar contraseña
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repite la contraseña"
          required
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-all"
      >
        {isLoading ? (
          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Lock className="h-4 w-4" />
            Restablecer contraseña
          </>
        )}
      </button>
    </form>
  );
}
