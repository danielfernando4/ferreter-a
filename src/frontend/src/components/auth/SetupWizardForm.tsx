import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Building2, UserCircle, CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { SetupRequest } from '../../types/auth';

interface SetupWizardFormProps {
  onComplete?: () => void;
}

export default function SetupWizardForm({ onComplete }: SetupWizardFormProps) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<SetupRequest>({
    nombre_completo: '',
    email: '',
    password: '',
    negocio_nombre: '',
    negocio_direccion: '',
    negocio_rfc: '',
    negocio_telefono: '',
  });

  const steps = [
    { title: 'Cuenta de Administrador', icon: UserCircle },
    { title: 'Datos del Negocio', icon: Building2 },
    { title: 'Resumen y Confirmar', icon: CheckCircle2 },
  ];

  const updateField = (field: keyof SetupRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isStepValid = (step: number): boolean => {
    if (step === 0) {
      return (
        formData.nombre_completo.trim().length > 0 &&
        formData.email.trim().length > 0 &&
        formData.password.trim().length >= 6
      );
    }
    if (step === 1) {
      return (
        formData.negocio_nombre.trim().length > 0 &&
        formData.negocio_direccion.trim().length > 0 &&
        formData.negocio_rfc.trim().length > 0
      );
    }
    return true;
  };

  const handleNext = () => {
    if (!isStepValid(currentStep)) {
      setError('Completa todos los campos obligatorios antes de continuar.');
      return;
    }
    setError('');
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setError('');
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!isStepValid(currentStep)) {
      setError('Completa todos los campos obligatorios.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const payload: SetupRequest = {
        ...formData,
        negocio_telefono: formData.negocio_telefono?.trim() || null,
      };
      const response = await authApi.setup(payload);
      // Auto-login after setup
      const loginResponse = await authApi.login({
        email: formData.email,
        password: formData.password,
        remember: true,
      });
      login(loginResponse.token, loginResponse.usuario, true);
      onComplete?.();
      navigate('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar la configuración inicial';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Steps indicator */}
      <div className="flex items-center justify-center mb-10">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all
                  ${
                    idx <= currentStep
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-200 text-slate-400'
                  }
                `}
              >
                {idx < currentStep ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={`hidden sm:block text-sm font-medium ${
                  idx <= currentStep ? 'text-indigo-600' : 'text-slate-400'
                }`}
              >
                {step.title}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`w-12 sm:w-20 h-0.5 mx-2 ${
                  idx < currentStep ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        {currentStep === 0 && (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <UserCircle className="h-12 w-12 text-indigo-600 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-slate-900">Cuenta de Administrador</h2>
              <p className="text-sm text-slate-500 mt-1">Crea la cuenta principal del sistema</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombre Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nombre_completo}
                onChange={(e) => updateField('nombre_completo', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                placeholder="Ej. Juan Pérez"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Correo Electrónico <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                placeholder="admin@ferreteria.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <Building2 className="h-12 w-12 text-indigo-600 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-slate-900">Datos del Negocio</h2>
              <p className="text-sm text-slate-500 mt-1">Configura los datos de tu ferretería</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombre del Negocio <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.negocio_nombre}
                onChange={(e) => updateField('negocio_nombre', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                placeholder="Ej. Ferretería El Constructor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Dirección <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.negocio_direccion}
                onChange={(e) => updateField('negocio_direccion', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                placeholder="Calle, número, colonia, ciudad"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                RFC <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.negocio_rfc}
                onChange={(e) => updateField('negocio_rfc', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                placeholder="RFC del negocio"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Teléfono
              </label>
              <input
                type="text"
                value={formData.negocio_telefono || ''}
                onChange={(e) => updateField('negocio_telefono', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                placeholder="Opcional"
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <CheckCircle2 className="h-12 w-12 text-indigo-600 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-slate-900">Resumen</h2>
              <p className="text-sm text-slate-500 mt-1">Revisa la información antes de confirmar</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-slate-700">Administrador</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-slate-500">Nombre:</span>
                  <p className="font-medium text-slate-900">{formData.nombre_completo}</p>
                </div>
                <div>
                  <span className="text-slate-500">Email:</span>
                  <p className="font-medium text-slate-900">{formData.email}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-slate-700">Negocio</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-slate-500">Nombre:</span>
                  <p className="font-medium text-slate-900">{formData.negocio_nombre}</p>
                </div>
                <div>
                  <span className="text-slate-500">Dirección:</span>
                  <p className="font-medium text-slate-900">{formData.negocio_direccion}</p>
                </div>
                <div>
                  <span className="text-slate-500">RFC:</span>
                  <p className="font-medium text-slate-900">{formData.negocio_rfc}</p>
                </div>
                {formData.negocio_telefono && (
                  <div>
                    <span className="text-slate-500">Teléfono:</span>
                    <p className="font-medium text-slate-900">{formData.negocio_telefono}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0 || isLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium bg-green-600 text-white hover:bg-green-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Confirmar y Comenzar'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
