import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Store, Loader2, AlertCircle } from 'lucide-react';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';
import { verifyResetToken } from '../services/api';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token') || '';
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValido, setTokenValido] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!tokenParam) {
      setError('No se proporcionó un token de recuperación.');
      setIsValidating(false);
      return;
    }

    const validate = async () => {
      try {
        const res = await verifyResetToken(tokenParam);
        if (res.valido) {
          setTokenValido(true);
        } else {
          setError('El token de recuperación no es válido.');
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'El token de recuperación es inválido o ha expirado.';
        setError(message);
      } finally {
        setIsValidating(false);
      }
    };

    validate();
  }, [tokenParam]);

  if (isValidating) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-500">Verificando token...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-8">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Token inválido
          </h2>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <a
            href="/login"
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium inline-block"
          >
            Volver al inicio de sesión
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-8">
      <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Ferretería</h2>
          <p className="text-sm text-slate-500 mt-1">
            Restablece tu contraseña
          </p>
        </div>
        {tokenValido && <ResetPasswordForm token={tokenParam} />}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
