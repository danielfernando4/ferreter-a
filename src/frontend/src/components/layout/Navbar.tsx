import React from 'react';
import { Menu, X, LogOut, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../services/api';

interface NavbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ sidebarOpen, onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // ignore
    }
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
      <div className="px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
          <h1 className="text-xl font-bold text-slate-900">Ferretería</h1>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <>
              <button
                type="button"
                onClick={() => navigate('/perfil')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors text-sm text-slate-600"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{user.nombre_completo}</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
