import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCircle,
  LogOut,
  Menu,
  X,
  Store,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SessionTimer from './SessionTimer';

const LayoutWithNav: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['administrador', 'bodega', 'vendedor', 'compras'] },
    { path: '/profile', label: 'Mi Perfil', icon: UserCircle, roles: ['administrador', 'bodega', 'vendedor', 'compras'] },
  ];

  const adminItems = [
    { path: '/admin/users', label: 'Usuarios', icon: Users, roles: ['administrador'] },
  ];

  const visibleNavItems = navItems.filter(item => user && item.roles.includes(user.role));
  const visibleAdminItems = adminItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-slate-50">
      <SessionTimer />

      {/* Mobile header */}
      <header className="lg:hidden bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-600 hover:text-slate-900 transition-all"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <Link to="/dashboard" className="flex items-center gap-2">
            <Store size={24} className="text-blue-600" />
            <span className="text-xl font-bold text-slate-900">Ferretería</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="text-slate-500 hover:text-red-600 transition-all"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200 shadow-sm transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-100">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center">
                <Store size={22} className="text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-900">Ferretería</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Navegación
            </p>
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {visibleAdminItems.length > 0 && (
              <>
                <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-6 mb-2">
                  Administración
                </p>
                {visibleAdminItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                        isActive(item.path)
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </>
            )}
          </nav>

          {/* User info + logout */}
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-9 h-9 bg-blue-100 rounded-2xl flex items-center justify-center">
                <UserCircle size={22} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user?.full_name || 'Usuario'}
                </p>
                <p className="text-xs text-slate-500 capitalize">{user?.role || ''}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-2xl transition-all"
            >
              <LogOut size={18} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className={`lg:ml-64 min-h-screen ${sidebarOpen ? 'overflow-hidden' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default LayoutWithNav;
