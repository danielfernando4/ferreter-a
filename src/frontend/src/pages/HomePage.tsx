import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Store, Users, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  const roleLabel =
    user.rol === 'administrador'
      ? 'Administrador'
      : user.rol === 'vendedor'
      ? 'Vendedor'
      : 'Almacén';

  const modules = [
    {
      title: 'Usuarios',
      description: 'Gestiona los usuarios del sistema',
      icon: Users,
      path: '/usuarios',
      color: 'bg-blue-50 text-blue-600',
      roles: ['administrador'],
    },
    {
      title: 'Mi Perfil',
      description: 'Administra tus datos y preferencias',
      icon: UserCircle,
      path: '/perfil',
      color: 'bg-purple-50 text-purple-600',
      roles: ['administrador', 'vendedor', 'almacen'],
    },
  ];

  const filteredModules = modules.filter((m) =>
    m.roles.includes(user.rol)
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Store className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Bienvenido, {user.nombre_completo}
            </h2>
            <p className="text-sm text-slate-500">
              Has iniciado sesión como{' '}
              <span className="font-medium text-slate-700">{roleLabel}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModules.map((mod) => {
          const Icon = mod.icon;
          return (
            <button
              key={mod.path}
              type="button"
              onClick={() => navigate(mod.path)}
              className="bg-white rounded-2xl shadow-sm p-6 text-left hover:shadow-md transition-all group"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${mod.color}`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                {mod.title}
              </h3>
              <p className="text-sm text-slate-500 mt-1">{mod.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HomePage;
