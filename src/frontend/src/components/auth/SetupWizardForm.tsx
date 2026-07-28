import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../services/api';
import { Loader2, Check, ChevronLeft, ChevronRight, Store, User, FileText } from 'lucide-react';

interface SetupWizardFormProps {
  onComplete: () => void;
}

interface FormData {
  nombre_completo: string;
  email: string;
  password: string;
  confirm_password: string;
  negocio_nombre: string;
  negocio_direccion: string;
  negocio_rfc: string;
  negocio_telefono: string;
}

export default function SetupWizardForm({ onComplete }: SetupWizardFormProps) {
  const { login } = useAuth();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    nombre_completo: '',
    email: '',
    password: '',
    confirm_password: '',
    negocio_nombre: '',
    negocio_direccion: '',
    negocio_rfc: '',
    negocio_telefono: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  function updateField(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function validateStep(stepIdx: number): boolean {
    setError('');
    if (stepIdx === 0) {
      if (!formData.nombre_completo.trim() || !formData.email.trim() || !formData.password.trim() || !formData.confirm_password.trim()) {
        setError('Todos los campos son obligatorios');
        return false;
      }
      if (formData.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return false;
      }
      if (formData.password !== formData.confirm_password) {
        setError('Las contraseñas no coinciden');
        return false;
      }
    }
    if (stepIdx === 1) {
      if (!formData.negocio_nombre.trim() || !formData.negocio_direccion.trim() || !formData.negocio_rfc.trim()) {
        setError('Todos los campos son obligatorios');
        return false;
      }
    }
    return true;
  }

  function handleNext() {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
    }
  }

  function handleBack() {
    setError('');
    setStep((prev) => prev - 1);
  }

  async function handleSubmit() {
    if (!validateStep(1)) return;
    setIsLoading(true);
    setError('');
    try {
      await authApi.setup({
        nombre_completo: formData.nombre_completo.trim(),
        email: formData.email.trim(),
        password: formData.password,
        negocio_nombre: formData.negocio_nombre.trim(),
        negocio_direccion: formData.negocio_direccion.trim(),
        negocio_rfc: formData.negocio_rfc.trim(),
        negocio_telefono: formData.negocio_telefono.trim() || null,
      });
      // Auto-login after setup
      await login(formData.email.trim(), formData.password);
      onComplete();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la configuración';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  const steps = [
    { icon: User, title: 'Cuenta de administrador', description: 'Crea la cuenta principal del sistema' },
    { icon: Store, title: 'Datos del negocio', description: 'Configura los datos de tu ferretería' },
    { icon: FileText, title: 'Resumen', description: 'Verifica la información antes de finalizar' },
  ];

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Steps indicator */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                  i < step
                    ? 'bg-indigo-600 text-white'
                    : i === step
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <div className="hidden sm:block">
                <p className={`text-xs font-medium ${i <= step ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {s.title}
                </p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 sm:w-12 h-0.5 mx-2 ${i < step ? 'bg-indigo-600' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-5 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Step 0: Admin Account */}
      {step === 0 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
            <input
              type="text"
              value={formData.nombre_completo}
              onChange={(e) => updateField('nombre_completo', e.target.value)}
              placeholder="Juan Pérez"
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="admin@ferreteria.com"
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar contraseña</label>
            <input
              type="password"
              value={formData.confirm_password}
              onChange={(e) => updateField('confirm_password', e.target.value)}
              placeholder="Repite la contraseña"
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              disabled={isLoading}
            />
          </div>
        </div>
      )}

      {/* Step 1: Business Data */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del negocio</label>
            <input
              type="text"
              value={formData.negocio_nombre}
              onChange={(e) => updateField('negocio_nombre', e.target.value)}
              placeholder="Ferretería El Martillo"
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
            <input
              type="text"
              value={formData.negocio_direccion}
              onChange={(e) => updateField('negocio_direccion', e.target.value)}
              placeholder="Calle Principal #123, Col. Centro"
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">RFC</label>
            <input
              type="text"
              value={formData.negocio_rfc}
              onChange={(e) => updateField('negocio_rfc', e.target.value)}
              placeholder="XXXX000000XXX"
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono <span className="text-slate-400">(opcional)</span></label>
            <input
              type="text"
              value={formData.negocio_telefono}
              onChange={(e) => updateField('negocio_telefono', e.target.value)}
              placeholder="+52 555 123 4567"
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              disabled={isLoading}
            />
          </div>
        </div>
      )}

      {/* Step 2: Summary */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-600" />
              Administrador
            </h3>
            <div className="space-y-1 text-sm text-slate-600">
              <p><span className="font-medium text-slate-700">Nombre:</span> {formData.nombre_completo}</p>
              <p><span className="font-medium text-slate-700">Email:</span> {formData.email}</p>
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Store className="h-4 w-4 text-indigo-600" />
              Negocio
            </h3>
            <div className="space-y-1 text-sm text-slate-600">
              <p><span className="font-medium text-slate-700">Nombre:</span> {formData.negocio_nombre}</p>
              <p><span className="font-medium text-slate-700">Dirección:</span> {formData.negocio_direccion}</p>
              <p><span className="font-medium text-slate-700">RFC:</span> {formData.negocio_rfc}</p>
              {formData.negocio_telefono && (
                <p><span className="font-medium text-slate-700">Teléfono:</span> {formData.negocio_telefono}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-8">
        {step > 0 ? (
          <button
            type="button"
            onClick={handleBack}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>
        ) : (
          <div />
        )}

        {step < steps.length - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all"
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-2xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {isLoading ? 'Guardando...' : 'Finalizar configuración'}
          </button>
        )}
      </div>
    </div>
  );
}
