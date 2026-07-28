import { useNavigate } from 'react-router-dom';
import SetupWizardForm from '../components/auth/SetupWizardForm';
import { Store } from 'lucide-react';

export default function SetupWizardPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 text-white mb-4">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Ferretería</h1>
          <p className="text-sm text-slate-500 mt-1">Configuración inicial del sistema</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <SetupWizardForm onComplete={() => navigate('/login')} />
        </div>
      </div>
    </div>
  );
}
