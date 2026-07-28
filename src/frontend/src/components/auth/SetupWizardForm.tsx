import { useState } from 'react';
import { Loader2, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { runSetup } from '../../services/api';
import type { SetupRequest } from '../../types/auth';

interface SetupWizardFormProps {
  onComplete: () => void;
}

export default function SetupWizardForm({ onComplete }: SetupWizardFormProps) {
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

  const [confirmPassword, setConfirmPassword] = useState('');

  const updateField = (field: keyof SetupRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.nombre_completo.trim()) return 'El nombre completo es obligatorio';
    if (!formData.email.trim()) return 'El correo electrónico es obligatorio';
    if (!formData.password) return 'La contraseña es obligatoria';
    if (formData.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    if (formData.password !== confirmPassword) return 'Las contraseñas no coinciden';
    return null;
  };

  const validateStep2 = () => {
    if (!formData.negocio_nombre.trim()) return 'El nombre del negocio es obligatorio';
    if (!formData.negocio_direccion.trim()) return 'La dirección es obligatoria';
    if (!formData.negocio_rfc.trim()) return 'El RFC es obligatorio';
    return null;
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
    }
    if (step === 2) {
      const err = validateStep2();
      if (err) { setError(err); return; }
    }
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    try {
      await runSetup(formData);
      onComplete();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la configuración';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-sm";

  return (
    <div className="space-y-6">
      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                s < step
                  ? 'bg-green-500 text-white'
                  : s === step
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {s < step ? <Check className="w-4 h-4" /> : s}
            </div>
            {s < 3 && (
              <div
                className={`h-0.5 w-12 transition-all ${
                  s < step ? 'bg-green-500' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="text-center">
        <h2 className="text-lg font-semibold text-slate-900">
          {step === 1 && 'Cuenta de administrador'}
          {step === 2 && 'Datos del negocio'}
          {step === 3 && 'Resumen de configuración'}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {step === 1 && 'Crea la cuenta principal del sistema'}
          {step === 2 && 'Ingresa los datos de tu establecimiento'}
          {step === 3 && 'Verifica la información antes de finalizar'}
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Step 1: Admin account */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre completo</label>
            <input
              type="text"
              value={formData.nombre_completo}
              onChange={(e) => updateField('nombre_completo', e.target.value)}
              className={inputClass}
              placeholder="Juan Pérez"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo electrónico</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              className={inputClass}
              placeholder="admin@ferreteria.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              className={inputClass}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirmar contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              placeholder="Repite la contraseña"
            />
          </div>
        </div>
      )}

      {/* Step 2: Business data */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre del negocio</label>
            <input
              type="text"
              value={formData.negocio_nombre}
              onChange={(e) => updateField('negocio_nombre', e.target.value)}
              className={inputClass}
              placeholder="Ferretería Central"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Dirección</label>
            <input
              type="text"
              value={formData.negocio_direccion}
              onChange={(e) => updateField('negocio_direccion', e.target.value)}
              className={inputClass}
              placeholder="Calle Principal #123"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">RFC</label>
            <input
              type="text"
              value={formData.negocio_rfc}
              onChange={(e) => updateField('negocio_rfc', e.target.value)}
              className={inputClass}
              placeholder="RFC del negocio"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Teléfono (opcional)</label>
            <input
              type="text"
              value={formData.negocio_telefono || ''}
              onChange={(e) => updateField('negocio_telefono', e.target.value)}
              className={inputClass}
              placeholder="+52 55 1234 5678"
            />
          </div>
        </div>
      )}

      {/* Step 3: Summary */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">Administrador</h3>
            <p className="text-sm text-slate-600">Nombre: {formData.nombre_completo}</p>
            <p className="text-sm text-slate-600">Email: {formData.email}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">Negocio</h3>
            <p className="text-sm text-slate-600">Nombre: {formData.negocio_nombre}</p>
            <p className="text-sm text-slate-600">Dirección: {formData.negocio_direccion}</p>
            <p className="text-sm text-slate-600">RFC: {formData.negocio_rfc}</p>
            {formData.negocio_telefono && (
              <p className="text-sm text-slate-600">Teléfono: {formData.negocio_telefono}</p>
            )}
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between pt-4">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
        ) : (
          <div />
        )}

        {step < 3 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-all"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Guardando...' : 'Finalizar configuración'}
          </button>
        )}
      </div>
    </div>
  );
}
