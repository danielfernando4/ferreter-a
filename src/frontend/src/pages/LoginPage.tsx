import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingState } from '../components/LoadingState';
import { LoginForm } from '../components/auth/LoginForm';
import { Store, Lock } from 'lucide-react';

export default function LoginPage() {
  const { isAuthenticated, isLoading, setupRequired, isCheckingSetup } = useAuth();

  if (isCheckingSetup || isLoading) {
    return <LoadingState message="Cargando..." />;
  }

  if (setupRequired) {
    return <Navigate to="/setup-wizard" replace />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Store size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Ferretería</h1>
          <p className="text-slate-500 mt-1">Inicia sesión para continuar</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
            <Lock size={18} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">Inicio de Sesión</h2>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
