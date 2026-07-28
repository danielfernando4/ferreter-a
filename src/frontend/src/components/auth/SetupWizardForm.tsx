import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Loader2, Check, Building, User, FileText } from 'lucide-react';
import { runSetup } from '../../services/api';
import type { SetupRequest } from '../../types/auth';

interface SetupWizardFormProps {
  onComplete?: () => void;
}

const SetupWizardForm: React.FC<SetupWizardFormProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
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

  const updateField = (field: keyof SetupRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep1 = (): boolean => {
    if (!formData.nombre_completo.trim()) {
      setError('El nombre completo es obligatorio.');
      return false;
    }
    if (!formData.email.trim()) {
      setError('El correo electrónico es obligatorio.');
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!formData.negocio_nombre.trim()) {
      setError('El nombre del negocio es obligatorio.');
      return false;
    }
    if (!formData.negocio_direccion.trim()) {
      setError('La dirección del negocio es obligatoria.');
      return false;
    }
    if (!formData.negocio_rfc.trim()) {
      setError('El RFC del negocio es obligatorio.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handlePrev = () => {
    setError('');
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      const payload: SetupRequest = {
        ...formData,
        negocio_telefono: formData.negocio_telefono || undefined,
      };
      await runSetup(payload);
      if (onComplete) onComplete();
      navigate('/login');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar la configuración inicial.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { number: 1, label: 'Cuenta Admin', icon: User },
    { number: 2, label: 'Datos del Negocio', icon: Building },
    { number: 3, label: 'Resumen', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((s, idx) => {
          const StepIcon = s.icon;
          const isActive = step === s.number;
          const isCompleted = step > s.number;
          return (
            <React.Fragment key={s.number}>
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
                    <Check className="w-5 h-5" />
                  ) : (
                    <StepIcon className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={`text-xs mt-1 font-medium ${
                    isActive ? 'text-blue-700' : 'text-slate-500'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`h-0.5 w-12 sm:w-16 ${
                    isCompleted ? 'bg-green-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Step 1: Admin Account */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Cuenta de Administrador</h3>
          <p className="text-sm text-slate-500">
            Crea la cuenta del administrador principal del sistema.
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre completo *
            </label>
            <input
              type="text"
              value={formData.nombre_completo}
              onChange={(e) => updateField('nombre_completo', e.target.value)}
              placeholder="Juan Pérez"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Correo electrónico *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="admin@ejemplo.com"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Contraseña *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
            />
          </div>
        </div>
      )}

      {/* Step 2: Business Data */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Datos del Negocio</h3>
          <p className="text-sm text-slate-500">
            Configura los datos básicos de la ferretería.
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre del negocio *
            </label>
            <input
              type="text"
              value={formData.negocio_nombre}
              onChange={(e) => updateField('negocio_nombre', e.target.value)}
              placeholder="Ferretería Mi Hogar"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Dirección *
            </label>
            <input
              type="text"
              value={formData.negocio_direccion}
              onChange={(e) => updateField('negocio_direccion', e.target.value)}
              placeholder="Calle Principal #123, Col. Centro"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              RFC *
            </label>
            <input
              type="text"
              value={formData.negocio_rfc}
              onChange={(e) => updateField('negocio_rfc', e.target.value)}
              placeholder="XXXX000000XXX"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Teléfono (opcional)
            </label>
            <input
              type="text"
              value={formData.negocio_telefono || ''}
              onChange={(e) => updateField('negocio_telefono', e.target.value)}
              placeholder="+52 123 456 7890"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
            />
          </div>
        </div>
      )}

      {/* Step 3: Summary */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Resumen de Configuración</h3>
          <p className="text-sm text-slate-500">
            Revisa la información antes de finalizar la configuración inicial.
          </p>

          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Administrador
              </h4>
              <p className="text-sm text-slate-900 mt-1">{formData.nombre_completo}</p>
              <p className="text-sm text-slate-500">{formData.email}</p>
            </div>
            <div className="border-t border-slate-200 pt-3">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Negocio
              </h4>
              <p className="text-sm text-slate-900 mt-1">{formData.negocio_nombre}</p>
              <p className="text-sm text-slate-500">{formData.negocio_direccion}</p>
              <p className="text-sm text-slate-500">RFC: {formData.negocio_rfc}</p>
              {formData.negocio_telefono && (
                <p className="text-sm text-slate-500">Tel: {formData.negocio_telefono}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={handlePrev}
          disabled={step === 1}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>

        {step < 3 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {isLoading ? 'Configurando...' : 'Finalizar Configuración'}
          </button>
        )}
      </div>
    </div>
  );
};

export default SetupWizardForm;
