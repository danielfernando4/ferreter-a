import { NavLink } from 'react-router-dom';
import { Users, UserCircle, LayoutDashboard, Store } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/usuarios', label: 'Usuarios', icon: Users },
  { to: '/perfil', label: 'Perfil', icon: UserCircle },
];

export function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen shadow-sm">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 rounded-2xl p-2">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Ferretería</h2>
            <p className="text-xs text-slate-500 capitalize">{user?.rol || 'Usuario'}</p>
          </div>
        </div>
      </div>
      <nav className="p-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
