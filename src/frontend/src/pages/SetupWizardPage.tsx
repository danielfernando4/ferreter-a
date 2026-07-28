import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkSetupStatus } from '../services/api';
import { SetupWizardForm } from '../components/auth/SetupWizardForm';
import { LoadingState } from '../components/ui/LoadingState';
import { Store } from 'lucide-react';

export function SetupWizardPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const status = await checkSetupStatus();
        if (status.setup_completed || status.admin_exists) {
          navigate('/login', { replace: true });
          return;
        }
      } catch {
        // If error, assume setup needed
      }
      setIsLoading(false);
    };
    check();
  }, [navigate]);

  const handleComplete = () => {
    navigate('/login', { replace: true });
  };

  if (isLoading) {
    return <LoadingState message="Verificando estado del sistema..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="bg-blue-600 rounded-2xl p-3 inline-flex mb-4 shadow-lg">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Ferretería</h1>
          <p className="text-sm text-slate-500 mt-1">Configuración inicial del sistema</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <SetupWizardForm onComplete={handleComplete} />
        </div>
      </div>
    </div>
  );
}
