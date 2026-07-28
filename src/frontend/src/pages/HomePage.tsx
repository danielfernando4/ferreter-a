import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingState } from '../components/LoadingState';
import { Users, Package, ShoppingCart, BarChart3 } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingState message="Verificando sesión..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const modules = [
    {
      title: 'Usuarios',
      description: 'Gestiona los usuarios del sistema',
      icon: Users,
      path: '/usuarios',
      color: 'bg-blue-500',
    },
    {
      title: 'Productos',
      description: 'Catálogo de productos y servicios',
      icon: Package,
      path: '#',
      color: 'bg-green-500',
      soon: true,
    },
    {
      title: 'Ventas',
      description: 'Punto de venta y facturación',
      icon: ShoppingCart,
      path: '#',
      color: 'bg-amber-500',
      soon: true,
    },
    {
      title: 'Reportes',
      description: 'Estadísticas y reportes del negocio',
      icon: BarChart3,
      path: '#',
      color: 'bg-purple-500',
      soon: true,
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Bienvenido, {user?.nombre_completo || 'Usuario'}
        </h1>
        <p className="text-slate-500 mt-1">
          Panel principal del sistema Ferretería
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <div
              key={mod.title}
              className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 transition-all ${
                !mod.soon ? 'hover:shadow-md hover:border-blue-200 cursor-pointer' : ''
              }`}
              onClick={() => {
                if (!mod.soon && mod.path !== '#') {
                  window.location.href = mod.path;
                }
              }}
            >
              <div
                className={`w-12 h-12 ${mod.color} rounded-2xl flex items-center justify-center mb-4`}
              >
                <Icon size={24} className="text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{mod.title}</h3>
              <p className="text-sm text-slate-500">{mod.description}</p>
              {mod.soon && (
                <span className="inline-block mt-3 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-2xl">
                  Próximamente
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
