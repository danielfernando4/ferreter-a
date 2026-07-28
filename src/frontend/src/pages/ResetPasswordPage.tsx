import { useParams } from 'react-router-dom';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Ferretería</h1>
        <p className="text-slate-500">Restablecer contraseña</p>
      </div>

      <div className="w-full max-w-md">
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 text-center">
            <p className="text-slate-500">Token no proporcionado</p>
            <a
              href="/forgot-password"
              className="inline-block mt-4 text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              Solicitar nuevo enlace
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
