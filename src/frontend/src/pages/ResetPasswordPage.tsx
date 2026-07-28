import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';
import { Store, AlertCircle, Loader2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [verifying, setVerifying] = useState(true);
  const [tokenValido, setTokenValido] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Token de restablecimiento no proporcionado');
      setVerifying(false);
      return;
    }

    let cancelled = false;
    async function verify() {
      try {
        const response = await authApi.verifyResetToken(token);
        if (cancelled) return;
        if (response.valido) {
          setTokenValido(true);
        } else {
          setError('El token no es válido');
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Token inválido o expirado';
          setError(msg);
        }
      } finally {
        if (!cancelled) setVerifying(false);
      }
    }
    verify();
    return () => { cancelled = true; };
  }, [token]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <p className="text-sm text-slate-500">Verificando token...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
            <Store className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Ferretería</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          {error ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-sm text-slate-600">{error}</p>
              <Link
                to="/forgot-password"
                className="inline-block rounded-2xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all"
              >
                Solicitar nuevo enlace
              </Link>
            </div>
          ) : (
            <ResetPasswordForm token={token} />
          )}
        </div>
      </div>
    </div>
  );
}
