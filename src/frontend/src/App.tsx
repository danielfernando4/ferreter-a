import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoadingState from './components/LoadingState';
import HomePage from './pages/HomePage';
import SetupWizardPage from './pages/SetupWizardPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import UserListPage from './pages/UserListPage';
import CreateUserPage from './pages/CreateUserPage';
import EditUserPage from './pages/EditUserPage';
import ProfilePage from './pages/ProfilePage';

function AppContent() {
  const { isAuthenticated, isLoading, setupRequired, checkingSetup } = useAuthContext();

  if (checkingSetup || isLoading) {
    return <LoadingState message="Cargando..." />;
  }

  // If setup is required, redirect to setup wizard
  if (setupRequired) {
    return (
      <Routes>
        <Route path="/setup-wizard" element={<SetupWizardPage />} />
        <Route path="*" element={<Navigate to="/setup-wizard" replace />} />
      </Routes>
    );
  }

  // If not authenticated, show public routes
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Authenticated routes with layout
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/usuarios"
          element={
            <ProtectedRoute requiredRole="administrador">
              <UserListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/usuarios/nuevo"
          element={
            <ProtectedRoute requiredRole="administrador">
              <CreateUserPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/usuarios/:id/editar"
          element={
            <ProtectedRoute requiredRole="administrador">
              <EditUserPage />
            </ProtectedRoute>
          }
        />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
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
