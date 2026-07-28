import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, UserCircle, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  open: boolean;
}

export function Sidebar({ open }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Usuarios', icon: Users, path: '/usuarios' },
    { label: 'Perfil', icon: UserCircle, path: '/perfil' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white border-r border-slate-200 shadow-sm transition-all duration-300 z-40 ${
        open ? 'w-64' : 'w-0 -translate-x-full lg:w-16 lg:translate-x-0'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-slate-200">
          <h2
            className={`font-bold text-slate-900 text-lg transition-opacity ${
              open ? 'opacity-100' : 'opacity-0 lg:hidden'
            }`}
          >
            Ferretería
          </h2>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all text-sm font-medium ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span
                  className={`transition-opacity ${
                    open ? 'opacity-100' : 'opacity-0 lg:hidden'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <div className={`mb-2 px-3 ${open ? '' : 'lg:hidden'}`}>
            <p className="text-xs text-slate-500 truncate">{user?.nombre_completo}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.rol}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all text-sm font-medium"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={`transition-opacity ${open ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
              Cerrar Sesión
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
