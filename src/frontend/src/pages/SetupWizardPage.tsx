import { useNavigate } from 'react-router-dom';
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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Ferretería</h1>
        <p className="text-slate-500 mt-1">Configuración inicial del sistema</p>
      </div>
      <SetupWizardForm onComplete={handleComplete} />
    </div>
  );
}
