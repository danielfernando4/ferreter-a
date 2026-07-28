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
import HomePage from './pages/HomePage';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/setup-wizard"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <SetupWizardPage />
        }
      />
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
        }
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
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
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
