import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SetupWizardForm from '../components/auth/SetupWizardForm';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function SetupWizardPage() {
  const navigate = useNavigate();
  const { checkingSetup, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!checkingSetup && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [checkingSetup, isAuthenticated, navigate]);

  if (checkingSetup) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
      </div>
    );
  }

  const handleComplete = () => {
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <SetupWizardForm onComplete={handleComplete} />
        </div>
      </div>
    </div>
  );
}
