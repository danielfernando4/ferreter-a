import { Link, useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import { Lock } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Lock className="text-blue-600" size={32} />
          <h1 className="text-2xl font-bold text-slate-900">Ferretería</h1>
        </div>
        <p className="text-slate-500">Inicia sesión para continuar</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <LoginForm onSuccess={handleSuccess} />

        <div className="mt-4 text-center">
          <Link
            to="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-700 transition-all"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>
    </div>
  );
}
