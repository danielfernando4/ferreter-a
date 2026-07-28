import { useAuth } from '../../hooks/useAuth';
import { Menu, LogOut, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden text-slate-500 hover:text-slate-700"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold text-indigo-600 lg:hidden">Ferretería</h1>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-all"
        >
          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
            <UserCircle className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-medium text-slate-900">{user?.nombre_completo ?? 'Usuario'}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.rol ?? ''}</p>
          </div>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-slate-200 py-2 z-50">
            <div className="px-4 py-2 border-b border-slate-100 sm:hidden">
              <p className="text-sm font-medium text-slate-900">{user?.nombre_completo ?? 'Usuario'}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.rol ?? ''}</p>
            </div>
            <button
              type="button"
              onClick={() => { navigate('/perfil'); setDropdownOpen(false); }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <UserCircle className="h-4 w-4" />
              Mi Perfil
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
