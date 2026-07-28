import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoginForm } from '../components/auth/LoginForm';
import { LoadingState } from '../components/ui/LoadingState';
import { Store } from 'lucide-react';

export function LoginPage() {
  const { isAuthenticated, isLoading, checkSetup } = useAuth();
  const navigate = useNavigate();
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    const check = async () => {
      if (isLoading) return;
      if (isAuthenticated) {
        navigate('/', { replace: true });
        return;
      }
      const needsSetup = await checkSetup();
      if (needsSetup) {
        navigate('/setup-wizard', { replace: true });
        return;
      }
      setCheckingSetup(false);
    };
    check();
  }, [isAuthenticated, isLoading, checkSetup, navigate]);

  if (isLoading || checkingSetup) {
    return <LoadingState message="Verificando sesión..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="bg-blue-600 rounded-2xl p-3 inline-flex mb-4 shadow-lg">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Ferretería</h1>
          <p className="text-sm text-slate-500 mt-1">Inicia sesión para continuar</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
