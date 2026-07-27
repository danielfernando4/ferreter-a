import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import {
  LayoutDashboard,
  Users,
  UserCircle,
  LogOut,
  Store,
  Clock,
} from 'lucide-react';

interface LayoutWithNavProps {
  children: React.ReactNode;
}

export default function LayoutWithNav({ children }: LayoutWithNavProps) {
  const { user, logout } = useAuth();
  const { timeLeft, showWarning } = useSession();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isAdmin = user?.role === 'administrador';

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, allowed: true },
    { to: '/profile', label: 'Mi Perfil', icon: UserCircle, allowed: true },
    { to: '/admin/users', label: 'Usuarios', icon: Users, allowed: isAdmin },
  ].filter((link) => link.allowed);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Store className="text-blue-600" size={28} />
              <Link to="/dashboard" className="text-xl font-bold text-slate-900">
                Ferretería
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {showWarning && (
                <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-xs font-medium">
                  <Clock size={14} />
                  Sesión expira en {formatTime(timeLeft)}
                </div>
              )}
              <span className="text-sm text-slate-500 hidden sm:block">
                {user?.full_name}
              </span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium capitalize hidden sm:block">
                {user?.role}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-red-600 transition-colors"
              >
                <LogOut size={18} />
                <span className="hidden sm:block">Salir</span>
              </button>
            </div>
          </div>
        </div>
        {/* Subnav */}
        <div className="border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-6 py-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors pb-1 border-b-2 ${
                    location.pathname === link.to
                      ? 'text-blue-600 border-blue-600'
                      : 'text-slate-500 border-transparent hover:text-slate-700'
                  }`}
                >
                  <link.icon size={16} />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
