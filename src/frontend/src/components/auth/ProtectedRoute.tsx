import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';
import LoadingState from '../LoadingState';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState message="Verificando sesión..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user && user.rol !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
