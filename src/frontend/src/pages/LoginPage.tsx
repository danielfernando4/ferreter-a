import { useAuth } from '../hooks/useAuth';
import { LoginForm } from '../components/auth/LoginForm';
import { Navigate, Link } from 'react-router-dom';
import { Tool } from 'lucide-react';

export function LoginPage() {
  const { isAuthenticated, isLoading, setupRequired, isSetupLoading } = useAuth();

  if (isSetupLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (setupRequired) {
    return <Navigate to="/setup-wizard" replace />;
  }

  if (isAuthenticated && !isLoading) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-4">
              <Tool className="w-7 h-7" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Ferretería</h1>
          <p className="text-slate-500 mt-1">Inicie sesión para continuar</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
