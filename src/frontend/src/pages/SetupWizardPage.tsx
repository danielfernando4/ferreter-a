import { useNavigate } from 'react-router-dom';
import { Store } from 'lucide-react';
import SetupWizardForm from '../components/auth/SetupWizardForm';

export default function SetupWizardPage() {
  const navigate = useNavigate();

  function handleComplete() {
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg mb-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
          <Store className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Ferretería</h1>
        <p className="text-slate-500 mt-2">
          Configuración inicial del sistema
        </p>
      </div>

      <div className="w-full bg-white rounded-2xl shadow-sm p-8">
        <SetupWizardForm onComplete={handleComplete} />
      </div>
    </div>
  );
}
