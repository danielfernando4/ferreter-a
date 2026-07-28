import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Users, LayoutDashboard, Package, ShoppingCart, FileText, BarChart3, X } from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Usuarios', icon: Users, path: '/usuarios', roles: ['administrador'] },
  { label: 'Productos', icon: Package, path: '/productos' },
  { label: 'Ventas', icon: ShoppingCart, path: '/ventas' },
  { label: 'Órdenes', icon: FileText, path: '/ordenes' },
  { label: 'Reportes', icon: BarChart3, path: '/reportes' },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const filteredItems = menuItems.filter((item) => {
    if (item.roles && user) {
      return item.roles.includes(user.rol);
    }
    return true;
  });

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg border-r border-slate-200
          transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 lg:hidden">
          <h2 className="text-lg font-bold text-slate-900">Menú</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
