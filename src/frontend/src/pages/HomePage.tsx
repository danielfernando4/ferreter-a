import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    // Redirect based on role
    if (user?.rol === 'administrador') {
      navigate('/usuarios', { replace: true });
    } else {
      navigate('/perfil', { replace: true });
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );
}
