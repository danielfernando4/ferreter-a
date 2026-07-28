import { useSearchParams } from 'react-router-dom';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Ferretería</h1>
            <p className="text-slate-500 text-sm mt-1">Restablecer contraseña</p>
          </div>
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm text-center">
              Token de recuperación no proporcionado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
