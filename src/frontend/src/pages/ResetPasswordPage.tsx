import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';
import * as api from '../services/api';

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [tokenValido, setTokenValido] = useState<boolean | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Token no proporcionado');
      setTokenValido(false);
      return;
    }
    (async () => {
      try {
        const res = await api.verifyResetToken(token);
        if (res.valido) {
          setTokenValido(true);
        } else {
          setError('El token no es válido');
          setTokenValido(false);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Token inválido o expirado';
        setError(msg);
        setTokenValido(false);
      }
    })();
  }, [token]);

  const handleSuccess = () => {
    navigate('/login', { replace: true });
  };

  if (tokenValido === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">Verificando token...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          {tokenValido && token ? (
            <ResetPasswordForm token={token} onSuccess={handleSuccess} />
          ) : (
            <div className="text-center">
              <div className="mx-auto w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="text-red-600" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Token inválido</h2>
              <p className="text-sm text-slate-500 mb-6">{error}</p>
              <a
                href="/forgot-password"
                className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all"
              >
                Solicitar nuevo enlace
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
