import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SetupWizardPage from './pages/SetupWizardPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import HomePage from './pages/HomePage';
import UserListPage from './pages/UserListPage';
import CreateUserPage from './pages/CreateUserPage';
import EditUserPage from './pages/EditUserPage';
import ProfilePage from './pages/ProfilePage';

function AppContent() {
  const { isLoading, isAuthenticated, setupRequired, setSetupRequired, checkSetupStatus } = useAuth();
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const status = await checkSetupStatus();
        if (!status.setup_completed && !status.admin_exists) {
          setSetupRequired(true);
        } else {
          setSetupRequired(false);
        }
      } catch {
        // If the endpoint fails, assume setup is not needed or already done
        setSetupRequired(false);
      } finally {
        setCheckingSetup(false);
      }
    };
    check();
  }, [checkSetupStatus, setSetupRequired]);

  // Show loading while checking setup
  if (checkingSetup || (isLoading && !isAuthenticated)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Inicializando sistema...</p>
        </div>
      </div>
    );
  }

  // Show setup wizard if required (and not authenticated)
  if (setupRequired && !isAuthenticated) {
    return <SetupWizardPage />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Protected routes with layout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/usuarios" element={<UserListPage />} />
        <Route path="/usuarios/nuevo" element={<CreateUserPage />} />
        <Route path="/usuarios/:id/editar" element={<EditUserPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
