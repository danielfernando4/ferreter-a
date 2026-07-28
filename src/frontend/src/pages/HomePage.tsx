import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingState from '../components/LoadingState';

export default function HomePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState message="Verificando sesión..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on role
  if (user.rol === 'administrador') {
    return <Navigate to="/usuarios" replace />;
  }

  // For non-admin users, redirect to profile
  return <Navigate to="/perfil" replace />;
}
