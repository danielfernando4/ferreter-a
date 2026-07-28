import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { X, Users, UserCircle, LayoutDashboard, LogOut } from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-sm border-r border-slate-200 transform transition-transform duration-200 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:z-auto`}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-900">Ferretería</h1>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          <button
            onClick={() => { navigate('/'); onClose(); }}
            className={`flex items-center w-full px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              isActive('/') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mr-3" />
            Dashboard
          </button>

          {user?.rol === 'administrador' && (
            <button
              onClick={() => { navigate('/usuarios'); onClose(); }}
              className={`flex items-center w-full px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive('/usuarios') || location.pathname.startsWith('/usuarios/')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4 mr-3" />
              Usuarios
            </button>
          )}

          <button
            onClick={() => { navigate('/perfil'); onClose(); }}
            className={`flex items-center w-full px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              isActive('/perfil') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserCircle className="w-4 h-4 mr-3" />
            Perfil
          </button>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {user?.nombre_completo}
              </p>
              <p className="text-xs text-slate-500 truncate">{user?.rol}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
