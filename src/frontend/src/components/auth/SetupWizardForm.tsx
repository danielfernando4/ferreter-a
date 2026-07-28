import { useState, type FormEvent } from 'react';
import { Store, User, Check, ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import * as api from '../../services/api';

interface SetupWizardFormProps {
  onComplete: () => void;
}

interface FormData {
  // Step 1 - Admin account
  nombre_completo: string;
  email: string;
  password: string;
  confirmPassword: string;
  // Step 2 - Business data
  negocio_nombre: string;
  negocio_direccion: string;
  negocio_rfc: string;
  negocio_telefono: string;
}

export default function SetupWizardForm({ onComplete }: SetupWizardFormProps) {
  const [step, setStep] = useState(1);
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

  function updateField(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function isStepValid(): boolean {
    if (step === 1) {
      return (
        formData.nombre_completo.trim() !== '' &&
        formData.email.trim() !== '' &&
        formData.password.length >= 6 &&
        formData.password === formData.confirmPassword
      );
    }
    if (step === 2) {
      return (
        formData.negocio_nombre.trim() !== '' &&
        formData.negocio_direccion.trim() !== '' &&
        formData.negocio_rfc.trim() !== ''
      );
    }
    return true;
  }

  function nextStep() {
    if (isStepValid()) {
      setError('');
      setStep((s) => s + 1);
    } else {
      setError('Por favor completa todos los campos obligatorios.');
    }
  }

  function prevStep() {
    setError('');
    setStep((s) => s - 1);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
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
        negocio_telefono: formData.negocio_telefono || null,
      });
      onComplete();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al guardar la configuración';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  const steps = [
    { num: 1, label: 'Cuenta Admin', icon: User },
    { num: 2, label: 'Datos del Negocio', icon: Store },
    { num: 3, label: 'Resumen', icon: Check },
  ];

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((s, idx) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
                step === s.num
                  ? 'bg-blue-600 text-white'
                  : step > s.num
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              <s.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`w-8 h-0.5 ${
                  step > s.num ? 'bg-green-400' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 mb-6 rounded-2xl bg-red-50 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()}>
        {/* Step 1: Admin Account */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Nombre Completo *
              </label>
              <input
                type="text"
                value={formData.nombre_completo}
                onChange={(e) => updateField('nombre_completo', e.target.value)}
                required
                placeholder="Tu nombre"
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Correo Electrónico *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                required
                placeholder="admin@ferreteria.com"
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Contraseña *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Confirmar Contraseña *
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                required
                placeholder="Repite la contraseña"
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Step 2: Business Data */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Nombre del Negocio *
              </label>
              <input
                type="text"
                value={formData.negocio_nombre}
                onChange={(e) => updateField('negocio_nombre', e.target.value)}
                required
                placeholder="Ferretería Ejemplo"
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Dirección *
              </label>
              <input
                type="text"
                value={formData.negocio_direccion}
                onChange={(e) => updateField('negocio_direccion', e.target.value)}
                required
                placeholder="Calle, número, colonia, ciudad"
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                RFC *
              </label>
              <input
                type="text"
                value={formData.negocio_rfc}
                onChange={(e) => updateField('negocio_rfc', e.target.value)}
                required
                placeholder="RFC del negocio"
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Teléfono
              </label>
              <input
                type="text"
                value={formData.negocio_telefono}
                onChange={(e) => updateField('negocio_telefono', e.target.value)}
                placeholder="Opcional"
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Step 3: Summary */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-slate-50 p-5 space-y-3">
              <h3 className="font-semibold text-slate-900">Cuenta de Administrador</h3>
              <div className="text-sm text-slate-600 space-y-1">
                <p><span className="font-medium">Nombre:</span> {formData.nombre_completo}</p>
                <p><span className="font-medium">Email:</span> {formData.email}</p>
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5 space-y-3">
              <h3 className="font-semibold text-slate-900">Datos del Negocio</h3>
              <div className="text-sm text-slate-600 space-y-1">
                <p><span className="font-medium">Nombre:</span> {formData.negocio_nombre}</p>
                <p><span className="font-medium">Dirección:</span> {formData.negocio_direccion}</p>
                <p><span className="font-medium">RFC:</span> {formData.negocio_rfc}</p>
                {formData.negocio_telefono && (
                  <p><span className="font-medium">Teléfono:</span> {formData.negocio_telefono}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8">
          {step > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Anterior
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all"
            >
              Siguiente
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Completar Configuración
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
