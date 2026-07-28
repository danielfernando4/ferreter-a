import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../context/AuthContext';
import { Store, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, setupRequired, checkingSetup } = useAuth();

  useEffect(() => {
    if (checkingSetup) return;
    if (setupRequired) {
      navigate('/setup-wizard', { replace: true });
      return;
    }
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, setupRequired, checkingSetup, navigate]);

  if (checkingSetup || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
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
          <h1 className="text-2xl font-bold text-slate-900">Ferretería</h1>
          <p className="text-sm text-slate-500 mt-1">Inicia sesión para continuar</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <LoginForm onSuccess={() => navigate('/', { replace: true })} />
        </div>
      </div>
    </div>
  );
}
