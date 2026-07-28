import { Menu, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-xl hover:bg-slate-100 lg:hidden"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-xl font-bold text-slate-900 lg:hidden">Ferretería</h1>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm text-slate-500 hidden sm:block">
              {user.nombre_completo}
            </span>
          )}
          <button
            onClick={() => navigate('/perfil')}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
            title="Perfil"
          >
            <UserCircle className="w-5 h-5" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl hover:bg-red-50 text-red-500 hover:text-red-600"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
