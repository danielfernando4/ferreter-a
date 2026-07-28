import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AppLayout from '../components/layout/AppLayout';
import { Store, Users, UserCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function DashboardContent() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const cards = [
    {
      label: 'Usuarios',
      icon: Users,
      desc: 'Gestiona las cuentas del sistema',
      color: 'bg-indigo-100 text-indigo-600',
      action: () => navigate('/usuarios'),
      roles: ['administrador'],
    },
    {
      label: 'Mi Perfil',
      icon: UserCircle,
      desc: 'Configura tu información personal',
      color: 'bg-emerald-100 text-emerald-600',
      action: () => navigate('/perfil'),
      roles: ['administrador', 'vendedor', 'almacen'],
    },
  ];

  const visibleCards = cards.filter(
    (c) => user && (c.roles.includes(user.rol) || user.rol === 'administrador')
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Bienvenido, {user?.nombre_completo?.split(' ')[0] ?? 'Usuario'}
        </h1>
        <p className="text-sm text-slate-500 capitalize">Rol: {user?.rol ?? ''}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleCards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={card.action}
            className="text-left bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md hover:border-indigo-200 transition-all group"
          >
            <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
              {card.label}
            </h3>
            <p className="text-xs text-slate-500 mt-1">{card.desc}</p>
            <div className="mt-3 flex items-center gap-1 text-xs font-medium text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
              Ir <ArrowRight className="h-3 w-3" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppLayout>
      <DashboardContent />
    </AppLayout>
  );
}
