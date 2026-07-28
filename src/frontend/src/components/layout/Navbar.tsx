import { Menu, LogOut } from 'lucide-react';
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
    <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <Menu className="h-5 w-5 text-slate-600" />
        </button>

        <div className="hidden lg:block">
          <h1 className="text-lg font-semibold text-slate-900">
            Bienvenido, {user?.nombre_completo || 'Usuario'}
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <span className="hidden sm:block text-sm text-slate-500">
            {user?.email || ''}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
