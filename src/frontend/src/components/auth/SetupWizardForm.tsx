import { useState } from 'react';
import { Loader2, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { authApi } from '../../services/api';

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

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep1 = (): boolean => {
    if (!formData.nombre_completo.trim()) {
      setError('El nombre completo es obligatorio');
      return false;
    }
    if (!formData.email.trim()) {
      setError('El correo electrónico es obligatorio');
      return false;
    }
    if (!formData.password) {
      setError('La contraseña es obligatoria');
      return false;
    }
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!formData.negocio_nombre.trim()) {
      setError('El nombre del negocio es obligatorio');
      return false;
    }
    if (!formData.negocio_direccion.trim()) {
      setError('La dirección es obligatoria');
      return false;
    }
    if (!formData.negocio_rfc.trim()) {
      setError('El RFC es obligatorio');
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

  const handleBack = () => {
    setError('');
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
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
      onComplete();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar configuración inicial';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                s <= step
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              {s < step ? <Check className="h-4 w-4" /> : s}
            </div>
            {s < 3 && (
              <div
                className={`h-0.5 w-8 transition-all ${
                  s < step ? 'bg-slate-900' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Step 1: Admin Account */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">Cuenta de Administrador</h2>
            <p className="text-sm text-slate-500 mt-1">Crea la cuenta principal del sistema</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
            <input
              type="text"
              value={formData.nombre_completo}
              onChange={(e) => updateField('nombre_completo', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm"
              placeholder="Juan Pérez"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm"
              placeholder="admin@ferreteria.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar contraseña</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm"
              placeholder="Repite la contraseña"
            />
          </div>
        </div>
      )}

      {/* Step 2: Business Info */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">Datos del Negocio</h2>
            <p className="text-sm text-slate-500 mt-1">Configura los datos de tu establecimiento</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del negocio</label>
            <input
              type="text"
              value={formData.negocio_nombre}
              onChange={(e) => updateField('negocio_nombre', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm"
              placeholder="Ferretería El Clavo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
            <input
              type="text"
              value={formData.negocio_direccion}
              onChange={(e) => updateField('negocio_direccion', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm"
              placeholder="Calle Principal #123, Centro"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">RFC</label>
            <input
              type="text"
              value={formData.negocio_rfc}
              onChange={(e) => updateField('negocio_rfc', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm"
              placeholder="XAXX010101000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono (opcional)</label>
            <input
              type="text"
              value={formData.negocio_telefono}
              onChange={(e) => updateField('negocio_telefono', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm"
              placeholder="+52 555 123 4567"
            />
          </div>
        </div>
      )}

      {/* Step 3: Summary */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">Resumen</h2>
            <p className="text-sm text-slate-500 mt-1">Revisa la información antes de finalizar</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase">Administrador</p>
              <p className="text-sm text-slate-900">{formData.nombre_completo}</p>
              <p className="text-sm text-slate-500">{formData.email}</p>
            </div>
            <div className="border-t border-slate-200 pt-3">
              <p className="text-xs font-medium text-slate-400 uppercase">Negocio</p>
              <p className="text-sm text-slate-900">{formData.negocio_nombre}</p>
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
      <div className="flex justify-between mt-8">
        {step > 1 ? (
          <button
            onClick={handleBack}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900 border border-slate-300 rounded-xl hover:bg-slate-50 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </button>
        ) : (
          <div />
        )}

        {step < 3 ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all text-sm font-medium"
          >
            Siguiente
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
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
