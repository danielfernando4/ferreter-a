import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="text-red-400 mb-4">
          <ShieldAlert size={64} />
        </div>
        <h3 className="text-xl font-semibold text-slate-700 mb-2">Acceso Denegado</h3>
        <p className="text-slate-500 text-center max-w-md">
          No tienes permisos para acceder a esta sección.
          Se requiere rol: {allowedRoles.join(', ')}.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleGuard;
