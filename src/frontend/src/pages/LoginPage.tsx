import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { isCheckingSetup, setupRequired } = useAuth();
  const navigate = useNavigate();
  const [errorMessage] = useState('');

  if (isCheckingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          <p className="text-sm text-slate-500">Verificando estado del sistema...</p>
        </div>
      </div>
    );
  }

  if (setupRequired) {
    navigate('/setup-wizard', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Ferretería</h1>
        <p className="text-slate-500">Inicia sesión para continuar</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {errorMessage}
          </div>
        )}
        <LoginForm onSuccess={() => navigate('/')} />
      </div>
    </div>
  );
}
