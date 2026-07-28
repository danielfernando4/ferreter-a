import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../services/api';
import { Check, ChevronRight, ChevronLeft, Store, User, Building2 } from 'lucide-react';

interface SetupWizardFormProps {
  onComplete: () => void;
}

interface FormData {
  // Step 1: Admin account
  nombre_completo: string;
  email: string;
  password: string;
  confirmPassword: string;
  // Step 2: Business info
  negocio_nombre: string;
  negocio_direccion: string;
  negocio_rfc: string;
  negocio_telefono: string;
}

const steps = [
  { id: 1, label: 'Cuenta Admin', icon: User },
  { id: 2, label: 'Datos del Negocio', icon: Building2 },
  { id: 3, label: 'Resumen', icon: Check },
];

export default function SetupWizardForm({ onComplete }: SetupWizardFormProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    nombre_completo: '',
    email: '',
    password: '',
    confirmPassword: '',
    negocio_nombre: '',
    negocio_direccion: '',
    negocio_rfc: '',
    negocio_telefono: '',
  });

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep1 = (): boolean => {
    if (!formData.nombre_completo.trim()) { setError('El nombre es obligatorio'); return false; }
    if (!formData.email.trim()) { setError('El email es obligatorio'); return false; }
    if (!formData.password) { setError('La contraseña es obligatoria'); return false; }
    if (formData.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return false; }
    if (formData.password !== formData.confirmPassword) { setError('Las contraseñas no coinciden'); return false; }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!formData.negocio_nombre.trim()) { setError('El nombre del negocio es obligatorio'); return false; }
    if (!formData.negocio_direccion.trim()) { setError('La dirección es obligatoria'); return false; }
    if (!formData.negocio_rfc.trim()) { setError('El RFC es obligatorio'); return false; }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handlePrev = () => {
    setError('');
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    setError('');
    setIsLoading(true);
    try {
      await api.runSetup({
        nombre_completo: formData.nombre_completo,
        email: formData.email,
        password: formData.password,
        negocio_nombre: formData.negocio_nombre,
        negocio_direccion: formData.negocio_direccion,
        negocio_rfc: formData.negocio_rfc,
        negocio_telefono: formData.negocio_telefono || undefined,
      });
      onComplete();
      navigate('/login');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Error al guardar la configuración inicial');
      } else {
        setError('Error al guardar la configuración inicial');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Steps indicator */}
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={`text-xs mt-1.5 font-medium ${
                    isActive ? 'text-blue-700' : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`w-12 sm:w-20 h-0.5 mx-2 ${
                    isCompleted ? 'bg-green-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Cuenta de Administrador</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Crea la cuenta de administrador principal del sistema.
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre completo</label>
              <input
                type="text"
                value={formData.nombre_completo}
                onChange={(e) => updateField('nombre_completo', e.target.value)}
                placeholder="Juan Pérez"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo electrónico</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="admin@ferreteria.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirmar contraseña</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                placeholder="Repite la contraseña"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Datos del Negocio</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Ingresa los datos de tu ferretería.
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre del negocio</label>
              <input
                type="text"
                value={formData.negocio_nombre}
                onChange={(e) => updateField('negocio_nombre', e.target.value)}
                placeholder="Ferretería El Martillo"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Dirección</label>
              <input
                type="text"
                value={formData.negocio_direccion}
                onChange={(e) => updateField('negocio_direccion', e.target.value)}
                placeholder="Calle Principal #123"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">RFC</label>
              <input
                type="text"
                value={formData.negocio_rfc}
                onChange={(e) => updateField('negocio_rfc', e.target.value)}
                placeholder="XXX000000XXX"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Teléfono <span className="text-slate-400">(opcional)</span>
              </label>
              <input
                type="text"
                value={formData.negocio_telefono}
                onChange={(e) => updateField('negocio_telefono', e.target.value)}
                placeholder="555-123-4567"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Check className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold text-slate-900">Resumen</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Revisa la información antes de finalizar.
            </p>
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-700">Administrador</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-slate-500">Nombre:</span>
                <span className="text-slate-900 font-medium">{formData.nombre_completo}</span>
                <span className="text-slate-500">Email:</span>
                <span className="text-slate-900 font-medium">{formData.email}</span>
              </div>
              <hr className="border-slate-200" />
              <h3 className="text-sm font-semibold text-slate-700">Negocio</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-slate-500">Nombre:</span>
                <span className="text-slate-900 font-medium">{formData.negocio_nombre}</span>
                <span className="text-slate-500">Dirección:</span>
                <span className="text-slate-900 font-medium">{formData.negocio_direccion}</span>
                <span className="text-slate-500">RFC:</span>
                <span className="text-slate-900 font-medium">{formData.negocio_rfc}</span>
                {formData.negocio_telefono && (
                  <>
                    <span className="text-slate-500">Teléfono:</span>
                    <span className="text-slate-900 font-medium">{formData.negocio_telefono}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
          ) : (
            <div />
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 transition-all"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Finalizar
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
