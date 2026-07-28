import { useState } from 'react';
import { Loader2, Building2, User, Check, ArrowLeft, ArrowRight } from 'lucide-react';

interface SetupWizardFormProps {
  onComplete: () => void;
  onSetup: (data: {
    nombre_completo: string;
    email: string;
    password: string;
    negocio_nombre: string;
    negocio_direccion: string;
    negocio_rfc: string;
    negocio_telefono?: string;
  }) => Promise<void>;
}

export default function SetupWizardForm({ onComplete, onSetup }: SetupWizardFormProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    password: '',
    confirmPassword: '',
    negocio_nombre: '',
    negocio_direccion: '',
    negocio_rfc: '',
    negocio_telefono: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.nombre_completo.trim()) return 'El nombre completo es obligatorio';
    if (!formData.email.trim()) return 'El correo electrónico es obligatorio';
    if (!formData.password) return 'La contraseña es obligatoria';
    if (formData.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    if (formData.password !== formData.confirmPassword) return 'Las contraseñas no coinciden';
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
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    try {
      await onSetup({
        nombre_completo: formData.nombre_completo,
        email: formData.email,
        password: formData.password,
        negocio_nombre: formData.negocio_nombre,
        negocio_direccion: formData.negocio_direccion,
        negocio_rfc: formData.negocio_rfc,
        negocio_telefono: formData.negocio_telefono || undefined,
      });
      onComplete();
    } catch (err: any) {
      setError(err.detail || 'Error al guardar la configuración inicial');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Steps indicator */}
      <div className="flex items-center justify-center mb-8 gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                s === step
                  ? 'bg-blue-600 text-white'
                  : s < step
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {s < step ? <Check size={16} /> : s}
            </div>
            {s < 3 && (
              <div
                className={`h-0.5 w-8 ${
                  s < step ? 'bg-green-500' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-xl">
                <User className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Cuenta de Administrador</h3>
                <p className="text-sm text-slate-500">Crea la cuenta principal del sistema</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
              <input
                type="text"
                value={formData.nombre_completo}
                onChange={(e) => updateField('nombre_completo', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900"
                placeholder="Juan Pérez"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900"
                placeholder="admin@ferreteria.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar contraseña</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900"
                placeholder="Repite la contraseña"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-xl">
                <Building2 className="text-green-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Datos del Negocio</h3>
                <p className="text-sm text-slate-500">Configura los datos de tu ferretería</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del negocio</label>
              <input
                type="text"
                value={formData.negocio_nombre}
                onChange={(e) => updateField('negocio_nombre', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900"
                placeholder="Ferretería El Martillo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
              <input
                type="text"
                value={formData.negocio_direccion}
                onChange={(e) => updateField('negocio_direccion', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900"
                placeholder="Av. Principal #123, Centro"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">RFC</label>
              <input
                type="text"
                value={formData.negocio_rfc}
                onChange={(e) => updateField('negocio_rfc', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900"
                placeholder="AAA000101XX1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono (opcional)</label>
              <input
                type="text"
                value={formData.negocio_telefono}
                onChange={(e) => updateField('negocio_telefono', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900"
                placeholder="55 1234 5678"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-xl">
                <Check className="text-purple-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Resumen</h3>
                <p className="text-sm text-slate-500">Verifica los datos antes de finalizar</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <h4 className="font-medium text-slate-900">Administrador</h4>
              <div className="text-sm text-slate-600 space-y-1">
                <p><span className="font-medium">Nombre:</span> {formData.nombre_completo}</p>
                <p><span className="font-medium">Email:</span> {formData.email}</p>
              </div>
              <hr className="border-slate-200" />
              <h4 className="font-medium text-slate-900">Negocio</h4>
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

        {error && (
          <div className="mt-4 bg-red-50 text-red-600 text-sm px-4 py-2 rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <div className="flex justify-between mt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-all"
            >
              <ArrowLeft size={18} /> Anterior
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
            >
              Siguiente <ArrowRight size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Check size={18} />
              )}
              {isLoading ? 'Guardando...' : 'Finalizar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
