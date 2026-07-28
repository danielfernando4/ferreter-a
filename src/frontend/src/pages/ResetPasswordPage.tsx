import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';
import { verifyResetToken } from '../services/api';
import { Store, Loader2, AlertTriangle } from 'lucide-react';

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [tokenValido, setTokenValido] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Token no proporcionado.');
      setLoading(false);
      return;
    }
    verifyResetToken(token)
      .then((res) => {
        if (res.valido) {
          setTokenValido(true);
        } else {
          setError('El token no es válido.');
        }
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err.message || 'El token es inválido o ha expirado.');
        setLoading(false);
      });
  }, [token]);

  const handleSuccess = () => {
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Token inválido</h1>
          <p className="text-sm text-slate-600 mb-6">{error}</p>
          <a
            href="/login"
            className="inline-block px-6 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-all"
          >
            Volver al inicio de sesión
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Restablecer contraseña</h1>
          <p className="text-sm text-slate-500 mt-1">Ingresa tu nueva contraseña</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          {token && <ResetPasswordForm token={token} onSuccess={handleSuccess} />}
        </div>
      </div>
    </div>
  );
}
