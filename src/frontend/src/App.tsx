import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import SetupWizardPage from './pages/SetupWizardPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import UserListPage from './pages/UserListPage';
import CreateUserPage from './pages/CreateUserPage';
import EditUserPage from './pages/EditUserPage';
import ProfilePage from './pages/ProfilePage';

function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <h1 className="text-3xl font-bold text-slate-900 mb-4">Ferretería</h1>
      <p className="text-slate-500 text-lg mb-8">Sistema de gestión</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
        <a
          href="/usuarios"
          className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all"
        >
          <span className="text-3xl">👥</span>
          <span className="font-medium text-slate-900">Usuarios</span>
        </a>
        <a
          href="/perfil"
          className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all"
        >
          <span className="text-3xl">👤</span>
          <span className="font-medium text-slate-900">Mi perfil</span>
        </a>
        <a
          href="/login"
          className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all"
        >
          <span className="text-3xl">🔒</span>
          <span className="font-medium text-slate-900">Iniciar sesión</span>
        </a>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/setup-wizard" element={<SetupWizardPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

          {/* Protected routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<HomePage />} />
            <Route path="/usuarios" element={
              <ProtectedRoute requiredRole="administrador">
                <UserListPage />
              </ProtectedRoute>
            } />
            <Route path="/usuarios/nuevo" element={
              <ProtectedRoute requiredRole="administrador">
                <CreateUserPage />
              </ProtectedRoute>
            } />
            <Route path="/usuarios/:id/editar" element={
              <ProtectedRoute requiredRole="administrador">
                <EditUserPage />
              </ProtectedRoute>
            } />
            <Route path="/perfil" element={<ProfilePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
