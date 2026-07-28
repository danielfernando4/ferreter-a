import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      // Redirect based on role
      if (user.rol === 'administrador') {
        navigate('/usuarios', { replace: true });
      } else {
        navigate('/productos', { replace: true });
      }
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <p className="text-sm text-slate-500">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 bg-indigo-100 rounded-2xl mb-4">
          <LayoutDashboard className="h-8 w-8 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Bienvenido a Ferretería</h1>
        <p className="text-slate-500 mt-2">Selecciona un módulo del menú lateral para comenzar</p>
      </div>
    </div>
  );
}
