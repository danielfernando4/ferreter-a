import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LayoutWithNav from '../components/LayoutWithNav';
import SessionTimer from '../components/SessionTimer';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import {
  Users,
  ShoppingCart,
  Package,
  TrendingUp,
  UserCheck,
  Shield,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }
      // Simulate loading dashboard data
      const timer = setTimeout(() => setLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [authLoading, user, navigate]);

  if (authLoading || loading) {
    return (
      <LayoutWithNav>
        <LoadingState message="Cargando dashboard..." />
      </LayoutWithNav>
    );
  }

  if (error) {
    return (
      <LayoutWithNav>
        <ErrorState message={error} onRetry={() => setLoading(true)} />
      </LayoutWithNav>
    );
  }

  if (!user) return null;

  const statsCards = [
    {
      title: 'Mi perfil',
      value: user.full_name,
      subtitle: user.role,
      icon: UserCheck,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Rol',
      value: user.role.charAt(0).toUpperCase() + user.role.slice(1),
      subtitle: 'Nivel de acceso',
      icon: Shield,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'Usuario',
      value: user.username,
      subtitle: 'Nombre de usuario',
      icon: Users,
      color: 'bg-green-50 text-green-600',
    },
    {
      title: 'Estado',
      value: user.is_active ? 'Activo' : 'Inactivo',
      subtitle: 'Cuenta',
      icon: TrendingUp,
      color: user.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600',
    },
  ];

  return (
    <LayoutWithNav>
      <SessionTimer />
      
      {/* Welcome section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Bienvenido, {user.full_name}
        </h1>
        <p className="text-slate-500 mt-1">
          Panel principal del sistema de gestión Ferretería
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${card.color}`}>
                <card.icon size={24} />
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-500">{card.title}</h3>
            <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
            <p className="text-xs text-slate-400 mt-1">{card.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Quick actions / modules */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Módulos del sistema</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl hover:bg-blue-50 transition-all text-left"
          >
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <UserCheck size={20} />
            </div>
            <div>
              <p className="font-medium text-slate-900 text-sm">Mi Perfil</p>
              <p className="text-xs text-slate-500">Ver y editar perfil</p>
            </div>
          </button>

          {user.role === 'administrador' && (
            <button
              onClick={() => navigate('/admin/users')}
              className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl hover:bg-blue-50 transition-all text-left"
            >
              <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                <Users size={20} />
              </div>
              <div>
                <p className="font-medium text-slate-900 text-sm">Usuarios</p>
                <p className="text-xs text-slate-500">Gestionar usuarios</p>
              </div>
            </button>
          )}

          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl opacity-60">
            <div className="p-2 bg-green-100 rounded-lg text-green-600">
              <Package size={20} />
            </div>
            <div>
              <p className="font-medium text-slate-900 text-sm">Inventario</p>
              <p className="text-xs text-slate-500">Próximamente</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl opacity-60">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
              <ShoppingCart size={20} />
            </div>
            <div>
              <p className="font-medium text-slate-900 text-sm">Ventas</p>
              <p className="text-xs text-slate-500">Próximamente</p>
            </div>
          </div>
        </div>
      </div>
    </LayoutWithNav>
  );
}
