import { useNavigate } from 'react-router-dom';
import SetupWizardForm from '../components/auth/SetupWizardForm';
import { Store } from 'lucide-react';

export default function SetupWizardPage() {
  const navigate = useNavigate();

  function handleComplete() {
    navigate('/', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
            <Store className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Configuración inicial</h1>
          <p className="text-sm text-slate-500 mt-1">
            Bienvenido a Ferretería. Complete los pasos para comenzar a usar el sistema.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
          <SetupWizardForm onComplete={handleComplete} />
        </div>
      </div>
    </div>
  );
}
