import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SetupWizardForm from '../components/auth/SetupWizardForm';
import { Store } from 'lucide-react';
import * as api from '../services/api';

export default function SetupWizardPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const status = await api.checkSetup();
        if (status.setup_completed || status.admin_exists) {
          navigate('/login', { replace: true });
        }
      } catch {
        setError('Error al verificar el estado del sistema');
      } finally {
        setIsLoading(false);
      }
    };
    checkSetup();
  }, [navigate]);

  const handleComplete = () => {
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
            <Store className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Error de conexión</h1>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Store className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Ferretería</h1>
          </div>
          <p className="text-slate-500">Configuración inicial del sistema</p>
        </div>
        <SetupWizardForm onComplete={handleComplete} />
      </div>
    </div>
  );
}
