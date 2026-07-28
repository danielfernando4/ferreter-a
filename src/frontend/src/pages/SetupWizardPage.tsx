import { useAuth } from '../hooks/useAuth';
import { SetupWizardForm } from '../components/auth/SetupWizardForm';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Tool } from 'lucide-react';

export function SetupWizardPage() {
  const { isSetupLoading, setupRequired } = useAuth();
  const navigate = useNavigate();
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!isSetupLoading && !setupRequired) {
      navigate('/login', { replace: true });
    }
  }, [isSetupLoading, setupRequired, navigate]);

  if (isSetupLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Verificando estado del sistema...</p>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Tool className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">¡Configuración completada!</h1>
          <p className="text-sm text-slate-500 mt-2">Redirigiendo al inicio de sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-4">
            <Tool className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Ferretería</h1>
          <p className="text-slate-500 mt-1">Configure su establecimiento para comenzar</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
          <SetupWizardForm onComplete={() => setCompleted(true)} />
        </div>
      </div>
    </div>
  );
}
