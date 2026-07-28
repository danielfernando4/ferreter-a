import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';
import { verifyResetToken, resetPasswordApi } from '../services/api';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { Lock, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [tokenValido, setTokenValido] = useState<boolean | null>(null);
  const [tokenEmail, setTokenEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [resetComplete, setResetComplete] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenValido(false);
      setError('Token no proporcionado');
      setIsLoading(false);
      return;
    }

    const verify = async () => {
      try {
        const res = await verifyResetToken(token);
        setTokenValido(res.valido);
        setTokenEmail(res.email);
      } catch (err: any) {
        setTokenValido(false);
        setError(err.detail || 'El token es inválido o ha expirado');
      } finally {
        setIsLoading(false);
      }
    };
    verify();
  }, [token]);

  const handleSubmit = async (token: string, newPassword: string, confirmPassword: string) => {
    await resetPasswordApi({ token, new_password: newPassword, confirm_password: confirmPassword });
  };

  const handleSuccess = () => {
    setResetComplete(true);
  };

  if (isLoading) {
    return <LoadingState message="Verificando validez del token..." />;
  }

  if (resetComplete) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Contraseña actualizada
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Tu contraseña ha sido restablecida exitosamente.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  if (!tokenValido) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <ErrorState
          message={error || 'El enlace de recuperación es inválido o ha expirado.'}
        />
        <Link
          to="/forgot-password"
          className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Lock className="text-blue-600" size={32} />
          <h1 className="text-2xl font-bold text-slate-900">Ferretería</h1>
        </div>
        <p className="text-slate-500">
          Restablece tu contraseña
          {tokenEmail && (
            <span className="block text-xs text-slate-400 mt-1">
              para {tokenEmail}
            </span>
          )}
        </p>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <ResetPasswordForm
          token={token}
          onSubmit={handleSubmit}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
}
