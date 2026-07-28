import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SetupWizardForm } from '../components/auth/SetupWizardForm';
import { LoadingState } from '../components/LoadingState';
import { Building2 } from 'lucide-react';

export function SetupWizardPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const { checkSetupStatus } = await import('../services/api');
        const status = await checkSetupStatus();
        if (status.setup_completed || status.admin_exists) {
          navigate('/login', { replace: true });
          return;
        }
      } catch {
        // If check fails, show wizard
      }
      setIsLoading(false);
    };
    checkSetup();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingState message="Verificando estado del sistema..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Configuración Inicial
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Bienvenido a Ferretería. Configura tu sistema en pocos pasos.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <SetupWizardForm onComplete={() => navigate('/login', { replace: true })} />
        </div>
      </div>
    </div>
  );
}
