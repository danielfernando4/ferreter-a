import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingState } from '../components/LoadingState';
import { SetupWizardForm } from '../components/auth/SetupWizardForm';
import { Store } from 'lucide-react';

export default function SetupWizardPage() {
  const { setupRequired, isCheckingSetup, isLoading, isAuthenticated } = useAuth();

  if (isCheckingSetup || isLoading) {
    return <LoadingState message="Verificando estado del sistema..." />;
  }

  if (!setupRequired) {
    return <Navigate to={isAuthenticated ? '/' : '/login'} replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Store size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Configuración Inicial</h1>
          <p className="text-slate-500 mt-2">
            Bienvenido a Ferretería. Vamos a configurar tu sistema.
          </p>
        </div>

        <SetupWizardForm
          onComplete={() => {
            window.location.href = '/login';
          }}
        />
      </div>
    </div>
  );
}
