import { Menu, LogOut, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-slate-500 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100"
      >
        <Menu size={22} />
      </button>

      <div className="hidden lg:flex items-center gap-2">
        <h1 className="text-lg font-semibold text-slate-900">Ferretería</h1>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <User size={16} className="text-blue-600" />
            </div>
            <span className="hidden sm:inline">{user.nombre_completo}</span>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
          title="Cerrar sesión"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
