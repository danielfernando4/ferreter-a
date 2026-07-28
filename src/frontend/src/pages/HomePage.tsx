import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2, LayoutDashboard } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on role
  if (user?.rol === 'administrador') {
    return <Navigate to="/usuarios" replace />;
  }

  // Default dashboard for other roles
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
        <LayoutDashboard className="h-10 w-10 text-slate-400" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Bienvenido a Ferretería</h1>
      <p className="text-slate-500">
        Has iniciado sesión como <span className="font-medium capitalize">{user?.rol}</span>
      </p>
    </div>
  );
}
