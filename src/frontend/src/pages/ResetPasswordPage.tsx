import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Store, AlertCircle } from 'lucide-react';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';
import * as api from '../services/api';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function verify() {
      if (!token) {
        setError('Token no proporcionado.');
        setIsVerifying(false);
        return;
      }
      try {
        await api.verifyResetToken(token);
        setIsVerifying(false);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Token inválido o expirado.';
        setError(message);
        setIsVerifying(false);
      }
    }
    verify();
  }, [token]);

  function handleSuccess() {
    navigate('/login', { replace: true });
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">
              Enlace Inválido
            </h2>
            <p className="text-slate-600">{error}</p>
            <button
              onClick={() => navigate('/forgot-password')}
              className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all"
            >
              Solicitar nuevo enlace
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md mb-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
          <Store className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Ferretería</h1>
        <p className="text-slate-500 mt-2">
          Restablecer contraseña
        </p>
      </div>

      <div className="w-full bg-white rounded-2xl shadow-sm p-8">
        <ResetPasswordForm token={token} onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
