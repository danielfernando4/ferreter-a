import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { verifyResetToken } from '../services/api';
import { ResetPasswordForm } from '../components/auth/ResetPasswordForm';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { Store } from 'lucide-react';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Token no proporcionado');
      setIsValidating(false);
      return;
    }
    const validate = async () => {
      try {
        await verifyResetToken(token);
        setTokenValid(true);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Token inválido o expirado';
        setError(message);
      } finally {
        setIsValidating(false);
      }
    };
    validate();
  }, [token]);

  if (isValidating) {
    return <LoadingState message="Verificando validez del token..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="bg-blue-600 rounded-2xl p-3 inline-flex mb-4 shadow-lg">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Ferretería</h1>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <ErrorState title="Token inválido" message={error} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="bg-blue-600 rounded-2xl p-3 inline-flex mb-4 shadow-lg">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Ferretería</h1>
          <p className="text-sm text-slate-500 mt-1">Restablecer contraseña</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <ResetPasswordForm token={token} />
        </div>
      </div>
    </div>
  );
}
