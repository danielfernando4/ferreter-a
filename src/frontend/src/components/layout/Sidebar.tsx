import { NavLink } from 'react-router-dom';
import {
  Users,
  UserCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

export default function Sidebar({ open, onToggle }: SidebarProps) {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'administrador';

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', show: true },
    { to: '/usuarios', icon: Users, label: 'Usuarios', show: isAdmin },
    { to: '/perfil', icon: UserCircle, label: 'Perfil', show: true },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white border-r border-slate-200 shadow-sm z-30 transition-all duration-300 ${
        open ? 'w-64' : 'w-16'
      }`}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
        {open && (
          <span className="text-lg font-bold text-slate-900 truncate">
            Ferretería
          </span>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          {open ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
      <nav className="p-3 space-y-1">
        {links
          .filter(l => l.show)
          .map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <link.icon size={20} />
              {open && <span>{link.label}</span>}
            </NavLink>
          ))}
      </nav>
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-200">
        {open && user && (
          <div className="px-3 py-2 text-sm text-slate-500 truncate">
            {user.nombre_completo}
          </div>
        )}
      </div>
    </aside>
  );
}
