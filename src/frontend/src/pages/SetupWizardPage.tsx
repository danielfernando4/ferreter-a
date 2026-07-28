import { useNavigate } from 'react-router-dom';
import { Store } from 'lucide-react';
import SetupWizardForm from '../components/auth/SetupWizardForm';
import { useAuth } from '../hooks/useAuth';

export default function SetupWizardPage() {
  const navigate = useNavigate();
  const { setSetupRequired } = useAuth();

  const handleComplete = () => {
    setSetupRequired(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-2xl shadow-sm mb-4">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Configuración Inicial</h1>
          <p className="text-sm text-slate-500 mt-1">
            Bienvenido a Ferretería. Configura tu cuenta de administrador y los datos del negocio.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <SetupWizardForm onComplete={handleComplete} />
        </div>
      </div>
    </div>
  );
}
