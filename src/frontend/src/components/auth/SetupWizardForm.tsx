import { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Store,
  MapPin,
  FileText,
  Phone,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  Building2,
} from 'lucide-react';
import { runSetup } from '../../services/api';

interface SetupWizardFormProps {
  onComplete: () => void;
}

type Step = 1 | 2 | 3;

interface Step1Data {
  nombre_completo: string;
  email: string;
  password: string;
}

interface Step2Data {
  negocio_nombre: string;
  negocio_direccion: string;
  negocio_rfc: string;
  negocio_telefono: string;
}

type FormData = Step1Data & Step2Data;

export function SetupWizardForm({ onComplete }: SetupWizardFormProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState<FormData>({
    nombre_completo: '',
    email: '',
    password: '',
    negocio_nombre: '',
    negocio_direccion: '',
    negocio_rfc: '',
    negocio_telefono: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.nombre_completo.trim()) return 'El nombre completo es obligatorio';
    if (!formData.email.trim()) return 'El correo electrónico es obligatorio';
    if (!formData.password || formData.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    return '';
  };

  const validateStep2 = () => {
    if (!formData.negocio_nombre.trim()) return 'El nombre del negocio es obligatorio';
    if (!formData.negocio_direccion.trim()) return 'La dirección es obligatoria';
    if (!formData.negocio_rfc.trim()) return 'El RFC es obligatorio';
    return '';
  };

  const handleNext = () => {
    const validationError = currentStep === 1 ? validateStep1() : validateStep2();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    if (currentStep === 1) setCurrentStep(2);
    else if (currentStep === 2) setCurrentStep(3);
  };

  const handlePrev = () => {
    setError('');
    if (currentStep === 2) setCurrentStep(1);
    else if (currentStep === 3) setCurrentStep(2);
  };

  const handleSubmit = async () => {
    setError('');
    setIsLoading(true);
    try {
      await runSetup({
        nombre_completo: formData.nombre_completo,
        email: formData.email,
        password: formData.password,
        negocio_nombre: formData.negocio_nombre,
        negocio_direccion: formData.negocio_direccion,
        negocio_rfc: formData.negocio_rfc,
        negocio_telefono: formData.negocio_telefono || undefined,
      });
      onComplete();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Error al guardar configuración inicial');
      } else {
        setError('Error al guardar configuración inicial');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Steps indicator */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold transition-all ${
                currentStep === step
                  ? 'bg-blue-600 text-white shadow-sm'
                  : currentStep > step
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {currentStep > step ? <Check size={18} /> : step}
            </div>
            {step < 3 && (
              <div
                className={`w-12 h-1 mx-2 rounded-full transition-all ${
                  currentStep > step ? 'bg-green-500' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-2xl text-sm mb-5">
            {error}
          </div>
        )}

        {/* Step 1: Admin Account */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <User size={40} className="mx-auto text-blue-600 mb-2" />
              <h3 className="text-lg font-semibold text-slate-900">Cuenta de Administrador</h3>
              <p className="text-sm text-slate-500">Crea la cuenta de administrador principal</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Nombre Completo
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={formData.nombre_completo}
                  onChange={(e) => updateField('nombre_completo', e.target.value)}
                  placeholder="Juan Pérez"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="admin@ferreteria.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Business Info */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Store size={40} className="mx-auto text-blue-600 mb-2" />
              <h3 className="text-lg font-semibold text-slate-900">Datos del Negocio</h3>
              <p className="text-sm text-slate-500">Configura los datos de tu ferretería</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Nombre del Negocio
              </label>
              <div className="relative">
                <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={formData.negocio_nombre}
                  onChange={(e) => updateField('negocio_nombre', e.target.value)}
                  placeholder="Ferretería El Martillo"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Dirección
              </label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={formData.negocio_direccion}
                  onChange={(e) => updateField('negocio_direccion', e.target.value)}
                  placeholder="Av. Principal #123, Centro"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                RFC
              </label>
              <div className="relative">
                <FileText size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={formData.negocio_rfc}
                  onChange={(e) => updateField('negocio_rfc', e.target.value)}
                  placeholder="XXX000101XXX"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Teléfono <span className="text-slate-400">(opcional)</span>
              </label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={formData.negocio_telefono}
                  onChange={(e) => updateField('negocio_telefono', e.target.value)}
                  placeholder="555-123-4567"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Summary */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Check size={40} className="mx-auto text-green-500 mb-2" />
              <h3 className="text-lg font-semibold text-slate-900">Resumen de Configuración</h3>
              <p className="text-sm text-slate-500">Verifica los datos antes de finalizar</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
              <h4 className="font-medium text-slate-900 text-sm">Cuenta de Administrador</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nombre:</span>
                  <span className="text-slate-900 font-medium">{formData.nombre_completo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="text-slate-900 font-medium">{formData.email}</span>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
              <h4 className="font-medium text-slate-900 text-sm">Datos del Negocio</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nombre:</span>
                  <span className="text-slate-900 font-medium">{formData.negocio_nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dirección:</span>
                  <span className="text-slate-900 font-medium">{formData.negocio_direccion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">RFC:</span>
                  <span className="text-slate-900 font-medium">{formData.negocio_rfc}</span>
                </div>
                {formData.negocio_telefono && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Teléfono:</span>
                    <span className="text-slate-900 font-medium">{formData.negocio_telefono}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6 pt-4 border-t border-slate-100">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 border border-slate-300 rounded-2xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
            >
              <ChevronLeft size={18} />
              Anterior
            </button>
          ) : (
            <div />
          )}
          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-2xl shadow-sm hover:bg-blue-700 transition-all text-sm font-medium"
            >
              Siguiente
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-2xl shadow-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Check size={18} />
              )}
              {isLoading ? 'Guardando...' : 'Finalizar Configuración'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
