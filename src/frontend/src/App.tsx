import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SetupWizardPage from './pages/SetupWizardPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import UserListPage from './pages/UserListPage';
import CreateUserPage from './pages/CreateUserPage';
import EditUserPage from './pages/EditUserPage';
import ProfilePage from './pages/ProfilePage';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { isAuthenticated, isLoading, setupRequired, setupLoading } = useAuth();

  if (isLoading || setupLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/setup-wizard"
        element={
          setupRequired ? <SetupWizardPage /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/login"
        element={
          setupRequired ? <Navigate to="/setup-wizard" replace /> :
          isAuthenticated ? <Navigate to="/" replace /> :
          <LoginPage />
        }
      />
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
        <Route path="/" element={
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-500">Bienvenido al sistema</p>
          </div>
        } />
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
      <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
