import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Eye, EyeOff, AlertCircle, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingState from '../components/LoadingState';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, setupRequired } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoading) return;
    if (setupRequired) {
      navigate('/setup', { replace: true });
      return;
    }
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, setupRequired, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Por favor ingresa tu usuario y contraseña');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await login(username.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Verificando..." />;
  }

  if (isAuthenticated) {
    return <LoadingState message="Redirigiendo..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
              <Store size={36} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Ferretería</h1>
          <p className="text-slate-500 mt-2">Inicia sesión para continuar</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700">
            <AlertCircle size={20} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre de usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Ingresa tu usuario"
              autoFocus
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-10"
                placeholder="Ingresa tu contraseña"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 text-white rounded-2xl shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium inline-flex items-center justify-center gap-2"
          >
            <LogIn size={20} />
            {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
