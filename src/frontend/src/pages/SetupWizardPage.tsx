import SetupWizardForm from '../components/auth/SetupWizardForm';

export default function SetupWizardPage() {
  const handleComplete = () => {
    // Redirigir al login después del setup
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Ferretería</h1>
            <p className="text-slate-500">Configuración inicial del sistema</p>
          </div>
          <SetupWizardForm onComplete={handleComplete} />
        </div>
      </div>
    </div>
  );
}
