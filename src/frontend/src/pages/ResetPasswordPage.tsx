import { useParams, Link } from 'react-router-dom';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';
import { ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 w-full max-w-md text-center">
          <p className="text-red-600 font-medium">Token no proporcionado.</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium mt-4"
          >
            <ArrowLeft size={16} />
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Ferretería</h1>
        <p className="text-slate-500 mt-1">Restablecer contraseña</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 w-full max-w-md">
        <ResetPasswordForm token={token} />
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft size={16} />
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
