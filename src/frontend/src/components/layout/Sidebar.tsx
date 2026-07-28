import { NavLink } from 'react-router-dom';
import { Users, UserCircle, Home, X } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/usuarios', label: 'Usuarios', icon: Users },
  { to: '/perfil', label: 'Perfil', icon: UserCircle },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      isActive
        ? 'bg-blue-100 text-blue-700 font-medium'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-sm border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <span className="text-lg font-bold text-slate-900">Ferretería</span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 lg:hidden"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={linkClasses}
              onClick={onClose}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
