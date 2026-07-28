import { NavLink } from 'react-router-dom';
import { Users, UserCircle, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function Sidebar() {
  const { user, logout } = useAuth();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      isActive
        ? 'bg-blue-100 text-blue-700 font-medium'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col shrink-0">
      <div className="p-5 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900">Ferretería</h1>
        {user && (
          <p className="text-sm text-slate-500 mt-1 truncate">{user.nombre_completo}</p>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <NavLink to="/" end className={linkClass}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/usuarios" className={linkClass}>
          <Users size={20} />
          <span>Usuarios</span>
        </NavLink>
        <NavLink to="/perfil" className={linkClass}>
          <UserCircle size={20} />
          <span>Perfil</span>
        </NavLink>
      </nav>

      <div className="p-4 border-t border-slate-200">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut size={20} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
