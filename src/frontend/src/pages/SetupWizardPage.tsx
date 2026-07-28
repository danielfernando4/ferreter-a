import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import SetupWizardForm from '../components/auth/SetupWizardForm';
import LoadingState from '../components/LoadingState';
import { runSetup } from '../services/api';
import { Building2 } from 'lucide-react';

export default function SetupWizardPage() {
  const navigate = useNavigate();
  const { login } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleSetup = async (data: {
    nombre_completo: string;
    email: string;
    password: string;
    negocio_nombre: string;
    negocio_direccion: string;
    negocio_rfc: string;
    negocio_telefono?: string;
  }) => {
    await runSetup(data);
    // After setup, log in the user
    await login(data.email, data.password);
  };

  const handleComplete = () => {
    navigate('/');
  };

  if (isLoading) {
    return <LoadingState message="Configurando sistema..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Building2 className="text-blue-600" size={32} />
          <h1 className="text-2xl font-bold text-slate-900">Ferretería</h1>
        </div>
        <p className="text-slate-500">Configuración inicial del sistema</p>
      </div>

      <SetupWizardForm onSetup={handleSetup} onComplete={handleComplete} />
    </div>
  );
}
