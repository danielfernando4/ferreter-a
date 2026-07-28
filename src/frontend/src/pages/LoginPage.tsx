import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoginForm from '../components/auth/LoginForm';
import { LogIn, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { isAuthenticated, isLoading, checkingSetup, setupRequired } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!checkingSetup && setupRequired) {
      navigate('/setup-wizard', { replace: true });
    } else if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [checkingSetup, setupRequired, isAuthenticated, isLoading, navigate]);

  if (checkingSetup || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <p className="text-sm text-slate-500">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 bg-indigo-100 rounded-2xl mb-4">
            <LogIn className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Ferretería</h1>
          <p className="text-slate-500 mt-2">Inicia sesión para continuar</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
