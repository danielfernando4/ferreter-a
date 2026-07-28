import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store } from 'lucide-react';
import SetupWizardForm from '../components/auth/SetupWizardForm';
import LoadingState from '../components/LoadingState';
import { checkSetupStatus } from '../services/api';

const SetupWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const status = await checkSetupStatus();
        if (status.setup_completed || status.admin_exists) {
          navigate('/login', { replace: true });
        }
      } catch {
        setError('Error al verificar el estado del sistema.');
      } finally {
        setIsLoading(false);
      }
    };
    verify();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingState message="Verificando estado del sistema..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Error de conexión
          </h2>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-8">
      <div className="bg-white rounded-2xl shadow-sm p-8 max-w-lg w-full mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Ferretería</h2>
          <p className="text-sm text-slate-500 mt-1">
            Configuración inicial del sistema
          </p>
        </div>
        <SetupWizardForm />
      </div>
    </div>
  );
};

export default SetupWizardPage;
