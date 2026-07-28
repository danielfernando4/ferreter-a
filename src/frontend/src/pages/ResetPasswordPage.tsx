import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';
import { verifyResetToken } from '../services/api';
import { Building, ArrowLeft, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tokenValido, setTokenValido] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token no proporcionado');
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function verify() {
      try {
        const res = await verifyResetToken(token);
        if (cancelled) return;
        if (res.valido) {
          setTokenValido(true);
        } else {
          setError('El token es inválido o ha expirado');
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'El token es inválido o ha expirado');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    verify();
    return () => { cancelled = true; };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">Verificando validez del token...</p>
        </div>
      </div>
    );
  }

  if (error && !tokenValido) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center">
          <div className="p-3 rounded-full bg-red-100 w-fit mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Token inválido</h2>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <button
            onClick={() => navigate('/forgot-password')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Solicitar nuevo enlace
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center">
          <div className="p-3 rounded-full bg-green-100 w-fit mx-auto mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Contraseña actualizada</h2>
          <p className="text-sm text-slate-500 mb-6">
            Tu contraseña ha sido restablecida exitosamente.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all"
          >
            Ir a iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-blue-600 text-white">
          <Building className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Ferretería</h1>
      </div>

      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          <h2 className="text-xl font-semibold text-slate-900 mb-1">Restablecer contraseña</h2>
          <p className="text-sm text-slate-500 mb-6">
            Ingresa tu nueva contraseña.
          </p>
          <ResetPasswordForm
            token={token || ''}
            onSuccess={() => setSuccess(true)}
          />
        </div>
      </div>
    </div>
  );
}
