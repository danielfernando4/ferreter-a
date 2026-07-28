import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Store } from 'lucide-react';
import SetupWizardForm from '../components/auth/SetupWizardForm';
import * as api from '../services/api';

export default function SetupWizardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const status = await api.checkSetup();
        if (status.admin_exists || status.setup_completed) {
          navigate('/login', { replace: true });
          return;
        }
        setShowWizard(true);
      } catch {
        setShowWizard(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const handleComplete = () => {
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">Verificando estado del sistema...</p>
        </div>
      </div>
    );
  }

  if (!showWizard) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Store className="text-blue-600" size={28} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Configuración Inicial</h1>
            <p className="text-sm text-slate-500 mt-1">
              Bienvenido a Ferretería. Configuremos tu sistema.
            </p>
          </div>
          <SetupWizardForm onComplete={handleComplete} />
        </div>
      </div>
    </div>
  );
}
