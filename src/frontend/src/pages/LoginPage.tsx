import { useAuth } from '../hooks/useAuth';
import LoginForm from '../components/auth/LoginForm';
import { Store } from 'lucide-react';

export default function LoginPage() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Store className="h-10 w-10 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">Ferretería</h1>
          </div>
          <p className="text-slate-500">Inicia sesión para continuar</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
