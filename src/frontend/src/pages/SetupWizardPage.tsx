import { useNavigate } from 'react-router-dom';
import { Store } from 'lucide-react';
import SetupWizardForm from '../components/auth/SetupWizardForm';

export default function SetupWizardPage() {
  const navigate = useNavigate();

  const handleComplete = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Store size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Ferretería</h1>
          <p className="text-slate-500 mt-1">Configuración inicial del sistema</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
          <SetupWizardForm onComplete={handleComplete} />
        </div>
      </div>
    </div>
  );
}
