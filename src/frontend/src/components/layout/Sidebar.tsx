import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Home, UserCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  open: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ open }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = [
    { label: 'Inicio', path: '/', icon: Home, roles: ['administrador', 'vendedor', 'almacen'] },
    { label: 'Usuarios', path: '/usuarios', icon: Users, roles: ['administrador'] },
    { label: 'Perfil', path: '/perfil', icon: UserCircle, roles: ['administrador', 'vendedor', 'almacen'] },
  ];

  const filteredItems = menuItems.filter(
    (item) => user && item.roles.includes(user.rol)
  );

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={`fixed left-0 top-16 z-20 h-[calc(100vh-4rem)] bg-white border-r border-slate-200 transition-all duration-300 shadow-sm ${
        open ? 'w-64' : 'w-0 overflow-hidden md:w-16'
      }`}
    >
      <div className="p-4 space-y-1">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {open && <span>{item.label}</span>}
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;
