import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getMe } from '../api/client';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { LayoutDashboard, User, Shield, Calendar, Store } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        await getMe();
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Error al cargar datos');
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingState message="Cargando dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  const roleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      administrador: 'bg-purple-100 text-purple-700',
      bodega: 'bg-blue-100 text-blue-700',
      vendedor: 'bg-green-100 text-green-700',
      compras: 'bg-amber-100 text-amber-700',
    };
    return colors[role] || 'bg-slate-100 text-slate-700';
  };

  const statsCards = [
    {
      title: 'Bienvenido',
      value: user?.full_name || 'Usuario',
      icon: User,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Rol',
      value: user?.role || '',
      icon: Shield,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'Usuario',
      value: user?.username || '',
      icon: LayoutDashboard,
      color: 'bg-green-50 text-green-600',
    },
    {
      title: 'Miembro desde',
      value: user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A',
      icon: Calendar,
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
          <Store size={28} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Panel principal de Ferretería</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${card.color}`}>
                  <Icon size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{card.title}</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {card.title === 'Rol' ? (
                      <span className={`inline-block px-3 py-0.5 rounded-full text-sm ${roleBadgeColor(card.value)}`}>
                        {card.value}
                      </span>
                    ) : (
                      card.value
                    )}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info panel */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Información del Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl">
            <p className="text-sm text-slate-500 mb-1">Nombre completo</p>
            <p className="text-base font-medium text-slate-900">{user?.full_name || '—'}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl">
            <p className="text-sm text-slate-500 mb-1">Correo electrónico</p>
            <p className="text-base font-medium text-slate-900">{user?.email || '—'}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl">
            <p className="text-sm text-slate-500 mb-1">Estado de cuenta</p>
            <p className={`text-base font-medium ${user?.is_active ? 'text-green-600' : 'text-red-600'}`}>
              {user?.is_active ? 'Activa' : 'Inactiva'}
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl">
            <p className="text-sm text-slate-500 mb-1">Rol</p>
            <p className="text-base font-medium text-slate-900 capitalize">{user?.role || '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
