import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSuccess = () => {
    navigate('/', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <LogIn className="text-blue-600" size={28} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Ferretería</h1>
            <p className="text-sm text-slate-500 mt-1">Inicia sesión para continuar</p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-xl border border-red-200">
              {errorMessage}
            </div>
          )}

          <LoginForm onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
}
