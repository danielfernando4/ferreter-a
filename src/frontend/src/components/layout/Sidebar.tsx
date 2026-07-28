import { NavLink, useLocation } from 'react-router-dom';
import {
  Users,
  UserCircle,
  X,
  Home,
  Shield,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth();
  const location = useLocation();

  const isAdmin = user?.rol === 'administrador';

  const links = [
    { to: '/', label: 'Inicio', icon: Home },
    ...(isAdmin
      ? [
          { to: '/usuarios', label: 'Usuarios', icon: Users },
          { to: '/usuarios/nuevo', label: 'Nuevo Usuario', icon: Shield },
        ]
      : []),
    { to: '/perfil', label: 'Perfil', icon: UserCircle },
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:w-64 lg:flex-col lg:z-20">
        <div className="flex flex-col flex-1 bg-white border-r border-slate-200 shadow-sm">
          <div className="flex items-center h-16 px-6 border-b border-slate-200">
            <Settings className="h-6 w-6 text-slate-700 mr-2" />
            <span className="text-xl font-bold text-slate-900">Ferretería</span>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                  {link.label}
                </NavLink>
              );
            })}
          </nav>
          <div className="p-4 border-t border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                <span className="text-xs font-medium text-slate-600">
                  {user?.nombre_completo?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user?.nombre_completo || 'Usuario'}
                </p>
                <p className="text-xs text-slate-500 truncate capitalize">
                  {user?.rol || '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 shadow-xl transform transition-transform duration-200 ease-in-out lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
          <div className="flex items-center">
            <Settings className="h-6 w-6 text-slate-700 mr-2" />
            <span className="text-xl font-bold text-slate-900">Ferretería</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        <nav className="px-3 py-4 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
