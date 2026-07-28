import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, Users, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const moduleLinks = [
  {
    to: '/usuarios',
    label: 'Usuarios',
    description: 'Gestionar usuarios del sistema',
    icon: Users,
    color: 'bg-blue-50 text-blue-600',
    roles: ['administrador'],
  },
  {
    to: '/perfil',
    label: 'Mi Perfil',
    description: 'Ver y editar tu perfil',
    icon: UserCircle,
    color: 'bg-green-50 text-green-600',
    roles: ['administrador', 'vendedor', 'almacen'],
  },
];

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 rounded-full p-2">
          <LayoutDashboard className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">
            Bienvenido, {user?.nombre_completo || 'Usuario'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {moduleLinks
          .filter((m) => user && (m.roles.includes(user.rol) || user.rol === 'administrador'))
          .map((module) => {
            const Icon = module.icon;
            return (
              <button
                key={module.to}
                type="button"
                onClick={() => navigate(module.to)}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-blue-200 transition-all text-left"
              >
                <div className={`w-12 h-12 rounded-2xl ${module.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-slate-900">{module.label}</h3>
                <p className="text-sm text-slate-500 mt-1">{module.description}</p>
              </button>
            );
          })}
      </div>
    </div>
  );
}
