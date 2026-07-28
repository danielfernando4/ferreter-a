import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, User, Settings } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-indigo-600" />
          <h1 className="text-xl font-bold text-slate-900">Ferretería</h1>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <>
              <button
                onClick={() => navigate('/perfil')}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                <User className="h-4 w-4" />
                <span>{user.nombre_completo}</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Salir</span>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
