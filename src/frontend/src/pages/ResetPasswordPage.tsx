import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Store, Loader2, AlertTriangle } from 'lucide-react';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';
import { authApi } from '../services/api';

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Token no proporcionado');
      setIsLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await authApi.verifyResetToken(token);
        if (response.valido) {
          setTokenValid(true);
          setEmail(response.email);
        } else {
          setError('El token es inválido o ha expirado');
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Token inválido o expirado';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    verifyToken();
  }, [token, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
          <p className="text-sm text-slate-500">Verificando token...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Token inválido</h1>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <button
            onClick={() => navigate('/forgot-password')}
            className="px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all text-sm font-medium"
          >
            Solicitar nuevo enlace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-2xl shadow-sm mb-4">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Restablecer contraseña</h1>
          {email && (
            <p className="text-sm text-slate-500 mt-1">
              Para {email}
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          {token && <ResetPasswordForm token={token} />}
        </div>
      </div>
    </div>
  );
}
