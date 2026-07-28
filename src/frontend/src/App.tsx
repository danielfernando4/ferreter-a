import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import HomePage from './pages/HomePage';
import SetupWizardPage from './pages/SetupWizardPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import UserListPage from './pages/UserListPage';
import CreateUserPage from './pages/CreateUserPage';
import EditUserPage from './pages/EditUserPage';
import ProfilePage from './pages/ProfilePage';
import ForbiddenPage from './pages/ForbiddenPage';

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/setup-wizard" element={<SetupWizardPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Protected routes */}
      <Route element={<AppLayout />}>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
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
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Route>
      {/* Public error routes */}
      <Route path="/403" element={<ForbiddenPage />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
