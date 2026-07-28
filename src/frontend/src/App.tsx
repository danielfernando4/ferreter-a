import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SetupWizardPage from './pages/SetupWizardPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import HomePage from './pages/HomePage';
import UserListPage from './pages/UserListPage';
import CreateUserPage from './pages/CreateUserPage';
import EditUserPage from './pages/EditUserPage';
import ProfilePage from './pages/ProfilePage';
import { Loader2 } from 'lucide-react';

function AuthRouter() {
  const { isLoading, setupRequired, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 size={36} className="animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Verificando estado del sistema...</p>
        </div>
      </div>
    );
  }

  if (setupRequired && !isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={<SetupWizardPage />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <HomePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute requiredRole="administrador">
            <AppLayout>
              <UserListPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuarios/nuevo"
        element={
          <ProtectedRoute requiredRole="administrador">
            <AppLayout>
              <CreateUserPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuarios/:id/editar"
        element={
          <ProtectedRoute requiredRole="administrador">
            <AppLayout>
              <EditUserPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ProfilePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}
