import { LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-slate-900">Ferretería</h1>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/perfil')}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-all"
        >
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">{user?.nombre_completo || 'Perfil'}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/usuarios')}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-all"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Usuarios</span>
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </nav>
  );
}
