import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface NavbarProps {
  onMenuToggle: () => void;
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors lg:hidden"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Ferretería</h1>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <>
            <span className="text-sm text-slate-500 hidden sm:block">
              {user.nombre_completo}
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
