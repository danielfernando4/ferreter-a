import { useState } from 'react';
import { runSetup } from '../../services/api';
import { Loader2, Check, ChevronLeft, ChevronRight } from 'lucide-react';

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

export function SetupWizardForm({ onComplete }: SetupWizardFormProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
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

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.nombre_completo.trim()) return 'El nombre es obligatorio';
    if (!formData.email.trim()) return 'El correo es obligatorio';
    if (!formData.password) return 'La contraseña es obligatoria';
    if (formData.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    if (formData.password !== formData.confirm_password) return 'Las contraseñas no coinciden';
    return '';
  };

  const validateStep2 = () => {
    if (!formData.negocio_nombre.trim()) return 'El nombre del negocio es obligatorio';
    if (!formData.negocio_direccion.trim()) return 'La dirección es obligatoria';
    if (!formData.negocio_rfc.trim()) return 'El RFC es obligatorio';
    return '';
  };

  const handleNext = () => {
    setError('');
    const validationError = step === 1 ? validateStep1() : validateStep2();
    if (validationError) {
      setError(validationError);
      return;
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError('');
    setStep((s) => s - 1);
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
      const message = err instanceof Error ? err.message : 'Error al guardar configuración inicial';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                s < step
                  ? 'bg-green-500 text-white'
                  : s === step
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {s < step ? <Check className="w-4 h-4" /> : s}
            </div>
            {s < 3 && (
              <div className={`h-1 w-12 rounded ${s < step ? 'bg-green-500' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
          {error}
        </div>
      )}

      {/* Step 1: Admin Account */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Cuenta de Administrador</h3>
          <p className="text-sm text-slate-500">Crea la cuenta principal del sistema.</p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
            <input
              type="text"
              value={formData.nombre_completo}
              onChange={(e) => updateField('nombre_completo', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Juan Pérez"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="admin@ferreteria.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar contraseña</label>
            <input
              type="password"
              value={formData.confirm_password}
              onChange={(e) => updateField('confirm_password', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="••••••••"
            />
          </div>
        </div>
      )}

      {/* Step 2: Business Info */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Datos del Negocio</h3>
          <p className="text-sm text-slate-500">Configura los datos básicos de tu ferretería.</p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del negocio</label>
            <input
              type="text"
              value={formData.negocio_nombre}
              onChange={(e) => updateField('negocio_nombre', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Ferretería El Clavo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
            <input
              type="text"
              value={formData.negocio_direccion}
              onChange={(e) => updateField('negocio_direccion', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Calle Principal #123, Centro"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">RFC</label>
            <input
              type="text"
              value={formData.negocio_rfc}
              onChange={(e) => updateField('negocio_rfc', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="ABC123456XYZ"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono (opcional)</label>
            <input
              type="text"
              value={formData.negocio_telefono}
              onChange={(e) => updateField('negocio_telefono', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="555-123-4567"
            />
          </div>
        </div>
      )}

      {/* Step 3: Summary */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Resumen</h3>
          <p className="text-sm text-slate-500">Revisa la información antes de finalizar.</p>
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Administrador</h4>
              <p className="text-sm text-slate-900 mt-1">{formData.nombre_completo}</p>
              <p className="text-sm text-slate-600">{formData.email}</p>
            </div>
            <div className="border-t border-slate-200 pt-3">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Negocio</h4>
              <p className="text-sm text-slate-900 mt-1">{formData.negocio_nombre}</p>
              <p className="text-sm text-slate-600">{formData.negocio_direccion}</p>
              <p className="text-sm text-slate-600">RFC: {formData.negocio_rfc}</p>
              {formData.negocio_telefono && (
                <p className="text-sm text-slate-600">Tel: {formData.negocio_telefono}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between pt-4">
        {step > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-2xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Atrás
          </button>
        ) : (
          <div />
        )}
        {step < 3 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-2xl shadow-sm hover:bg-blue-700 transition-all text-sm font-medium"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-2xl shadow-sm hover:bg-green-700 disabled:opacity-50 transition-all text-sm font-medium"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Guardando...' : 'Finalizar configuración'}
          </button>
        )}
      </div>
    </div>
  );
}
