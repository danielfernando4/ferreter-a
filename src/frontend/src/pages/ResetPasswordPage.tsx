import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ResetPasswordForm } from '../components/auth/ResetPasswordForm';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { KeyRound } from 'lucide-react';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Token de recuperación no proporcionado');
      setIsVerifying(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const { verifyResetToken } = await import('../services/api');
        const result = await verifyResetToken(token);
        if (result.valido) {
          setIsValid(true);
        } else {
          setError('El token de recuperación no es válido');
        }
      } catch (err: unknown) {
        const apiErr = err as { message?: string; status?: number };
        if (apiErr?.status === 410) {
          setError('El token ha expirado. Solicita un nuevo enlace de recuperación.');
        } else {
          setError(apiErr?.message || 'Error al verificar el token');
        }
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingState message="Verificando token..." />
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <ErrorState
            title="Token Inválido"
            message={error}
            onRetry={() => navigate('/forgot-password')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <KeyRound className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Restablecer Contraseña
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ingresa tu nueva contraseña
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <ResetPasswordForm
            token={token}
            onSuccess={() => navigate('/login', { replace: true })}
          />
        </div>
      </div>
    </div>
  );
}
