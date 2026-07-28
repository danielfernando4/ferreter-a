import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoginForm from '../components/auth/LoginForm';
import { useEffect } from 'react';

export default function LoginPage() {
  const { isAuthenticated, setupRequired, setupLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!setupLoading && setupRequired) {
      navigate('/setup-wizard', { replace: true });
    }
  }, [setupRequired, setupLoading, navigate]);

  useEffect(() => {
    if (!setupLoading && !setupRequired && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, setupRequired, setupLoading, navigate]);

  if (setupLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (setupRequired) {
    return null;
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-blue-600">F</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Ferretería</h1>
            <p className="text-slate-500 text-sm mt-1">Inicia sesión para continuar</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
