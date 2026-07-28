import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import SetupWizardForm from '../components/auth/SetupWizardForm';
import { Loader2, Settings } from 'lucide-react';

export default function SetupWizardPage() {
  const { checkingSetup, setupRequired, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!checkingSetup) {
      if (!setupRequired) {
        navigate('/login', { replace: true });
      } else if (isAuthenticated) {
        navigate('/', { replace: true });
      }
    }
  }, [checkingSetup, setupRequired, isAuthenticated, navigate]);

  if (checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <p className="text-sm text-slate-500">Verificando estado del sistema...</p>
        </div>
      </div>
    );
  }

  if (!setupRequired) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-16 w-16 bg-indigo-100 rounded-2xl mb-4">
            <Settings className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Ferretería</h1>
          <p className="text-slate-500 mt-2">Configuración Inicial del Sistema</p>
        </div>
        <SetupWizardForm />
      </div>
    </div>
  );
}
