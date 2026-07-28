import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';
import { verifyResetToken } from '../services/api';
import { Store, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenValido, setTokenValido] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token no proporcionado');
      setIsVerifying(false);
      return;
    }

    verifyResetToken(token)
      .then((res) => {
        if (res.valido) {
          setTokenValido(true);
        } else {
          setError('El token no es válido');
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Token inválido o expirado';
        setError(msg);
      })
      .finally(() => setIsVerifying(false));
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 text-white mb-4">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Ferretería</h1>
          <p className="text-sm text-slate-500 mt-1">Restablecer contraseña</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          {isVerifying && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="w-6 h-6 animate-spin text-slate-900" />
              <p className="text-sm text-slate-500">Verificando token...</p>
            </div>
          )}

          {!isVerifying && error && !tokenValido && (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Token inválido</h3>
                <p className="text-sm text-slate-500 mt-1">{error}</p>
              </div>
            </div>
          )}

          {!isVerifying && success && (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Contraseña actualizada</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Tu contraseña se ha restablecido exitosamente.
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="py-2.5 px-6 rounded-xl bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 transition-all"
              >
                Ir al inicio de sesión
              </button>
            </div>
          )}

          {!isVerifying && tokenValido && !success && (
            <ResetPasswordForm
              token={token}
              onSuccess={() => setSuccess(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
