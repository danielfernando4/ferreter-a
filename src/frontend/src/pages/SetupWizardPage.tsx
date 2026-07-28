import SetupWizardForm from '../components/auth/SetupWizardForm';
import { useNavigate } from 'react-router-dom';
import { Building } from 'lucide-react';

export default function SetupWizardPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-blue-600 text-white">
          <Building className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Ferretería</h1>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Configuración Inicial
        </h2>
        <p className="text-sm text-slate-500">
          Bienvenido. Completa los siguientes pasos para configurar tu sistema.
        </p>
      </div>

      <SetupWizardForm onComplete={() => navigate('/login')} />
    </div>
  );
}
