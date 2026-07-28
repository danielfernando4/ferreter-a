import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ResetPasswordForm } from '../components/auth/ResetPasswordForm';
import { Lock, AlertCircle } from 'lucide-react';
import * as api from '../services/api';

export function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const [verifying, setVerifying] = useState(true);
  const [valid, setValid] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Token no proporcionado');
      setVerifying(false);
      return;
    }

    async function verify() {
      try {
        const result = await api.verifyResetToken(token);
        if (result.valido) {
          setValid(true);
        } else {
          setError('El enlace no es válido');
        }
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'status' in err) {
          const apiErr = err as { status: number };
          if (apiErr.status === 410) {
            setError('El enlace ha expirado');
          } else if (apiErr.status === 404) {
            setError('El enlace no es válido');
          } else {
            setError('Error al verificar el enlace');
          }
        } else {
          setError('Error al conectar con el servidor');
        }
      } finally {
        setVerifying(false);
      }
    }
    verify();
  }, [token]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Verificando enlace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Enlace inválido</h2>
            <p className="text-sm text-slate-500 mb-6">{error}</p>
            <a
              href="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Solicitar nuevo enlace
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Restablecer contraseña</h1>
          <p className="text-slate-500 mt-1">Ingrese su nueva contraseña</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
          {valid && token && <ResetPasswordForm token={token} />}
        </div>
      </div>
    </div>
  );
}
