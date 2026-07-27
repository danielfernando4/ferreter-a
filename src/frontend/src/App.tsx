import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SessionProvider } from './contexts/SessionContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';
import LayoutWithNav from './components/LayoutWithNav';
import SetupWizardPage from './pages/SetupWizardPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import UserListPage from './pages/admin/UserListPage';
import UserFormPage from './pages/admin/UserFormPage';

const AppRoutes: React.FC = () => {
  const { isLoading, setupRequired } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600">Inicializando...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/setup"
        element={
          setupRequired ? (
            <SetupWizardPage />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes with layout */}
      <Route
        element={
          <ProtectedRoute>
            <SessionProvider>
              <LayoutWithNav />
            </SessionProvider>
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Admin routes */}
        <Route
          path="/admin/users"
          element={
            <RoleGuard allowedRoles={['administrador']}>
              <UserListPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/users/new"
          element={
            <RoleGuard allowedRoles={['administrador']}>
              <UserFormPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/users/:id/edit"
          element={
            <RoleGuard allowedRoles={['administrador']}>
              <UserFormPage />
            </RoleGuard>
          }
        />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to={setupRequired ? '/setup' : '/dashboard'} replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
