import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { verifyResetToken } from '../services/api';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Token no proporcionado');
      setIsVerifying(false);
      return;
    }

    async function verify() {
      try {
        const res = await verifyResetToken(token);
        if (res.valido) {
          setIsValid(true);
        } else {
          setError('El token no es válido');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Token inválido o expirado';
        setError(msg);
      } finally {
        setIsVerifying(false);
      }
    }
    verify();
  }, [token]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-slate-900" />
          <p className="text-sm text-slate-500">Verificando token...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <XCircle size={32} className="text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Token inválido</h2>
          <p className="text-slate-500 mt-2 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Restablecer contraseña</h1>
          <p className="text-slate-500 mt-1">Ingresa tu nueva contraseña</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
          <ResetPasswordForm
            token={token!}
            onSuccess={() => navigate('/login')}
          />
        </div>
      </div>
    </div>
  );
}
