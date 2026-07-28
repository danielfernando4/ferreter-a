import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store } from 'lucide-react';
import LoginForm from '../components/auth/LoginForm';
import LoadingState from '../components/LoadingState';
import { useAuth } from '../hooks/useAuth';
import { checkSetupStatus } from '../services/api';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    const verify = async () => {
      try {
        const status = await checkSetupStatus();
        if (!status.setup_completed && !status.admin_exists) {
          navigate('/setup-wizard', { replace: true });
          return;
        }
      } catch {
        // If error, assume setup is done
      } finally {
        setCheckingSetup(false);
      }
    };

    if (!authLoading && !isAuthenticated) {
      verify();
    } else if (!authLoading && isAuthenticated) {
      navigate('/', { replace: true });
    } else {
      setCheckingSetup(false);
    }
  }, [navigate, isAuthenticated, authLoading]);

  if (authLoading || checkingSetup) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingState message="Verificando..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-8">
      <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Ferretería</h2>
          <p className="text-sm text-slate-500 mt-1">
            Inicia sesión para continuar
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
