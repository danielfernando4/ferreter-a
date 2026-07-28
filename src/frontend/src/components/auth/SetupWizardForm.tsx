import { useState } from 'react';
import { runSetup } from '../../services/api';
import { Loader2, Check, ArrowLeft, ArrowRight, Store } from 'lucide-react';

interface SetupWizardFormProps {
  onComplete: () => void;
}

export default function SetupWizardForm({ onComplete }: SetupWizardFormProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    password: '',
    confirm_password: '',
    negocio_nombre: '',
    negocio_direccion: '',
    negocio_rfc: '',
    negocio_telefono: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.nombre_completo.trim()) return 'El nombre completo es obligatorio.';
    if (!formData.email.trim()) return 'El correo electrónico es obligatorio.';
    if (!formData.password.trim()) return 'La contraseña es obligatoria.';
    if (formData.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    if (formData.password !== formData.confirm_password) return 'Las contraseñas no coinciden.';
    return null;
  };

  const validateStep2 = () => {
    if (!formData.negocio_nombre.trim()) return 'El nombre del negocio es obligatorio.';
    if (!formData.negocio_direccion.trim()) return 'La dirección es obligatoria.';
    if (!formData.negocio_rfc.trim()) return 'El RFC es obligatorio.';
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
    setStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    setError('');
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setError('');
    setIsLoading(true);
    try {
      await runSetup({
        nombre_completo: formData.nombre_completo.trim(),
        email: formData.email.trim(),
        password: formData.password,
        negocio_nombre: formData.negocio_nombre.trim(),
        negocio_direccion: formData.negocio_direccion.trim(),
        negocio_rfc: formData.negocio_rfc.trim(),
        negocio_telefono: formData.negocio_telefono.trim() || null,
      });
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la configuración inicial.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                s === step
                  ? 'bg-slate-900 text-white'
                  : s < step
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {s < step ? <Check className="h-4 w-4" /> : s}
            </div>
            {s < 3 && (
              <div
                className={`w-16 h-0.5 ${
                  s < step ? 'bg-green-500' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200 mb-5">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <div className="text-center mb-6">
            <Store className="h-10 w-10 mx-auto mb-2 text-slate-900" />
            <h2 className="text-xl font-bold text-slate-900">Cuenta de administrador</h2>
            <p className="text-sm text-slate-500 mt-1">Crea la cuenta principal del sistema.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre completo</label>
            <input
              type="text"
              value={formData.nombre_completo}
              onChange={(e) => updateField('nombre_completo', e.target.value)}
              placeholder="Juan Pérez"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo electrónico</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="admin@ferreteria.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirmar contraseña</label>
            <input
              type="password"
              value={formData.confirm_password}
              onChange={(e) => updateField('confirm_password', e.target.value)}
              placeholder="Repite la contraseña"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div className="text-center mb-6">
            <Store className="h-10 w-10 mx-auto mb-2 text-slate-900" />
            <h2 className="text-xl font-bold text-slate-900">Datos del negocio</h2>
            <p className="text-sm text-slate-500 mt-1">Configura la información de tu ferretería.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre del negocio</label>
            <input
              type="text"
              value={formData.negocio_nombre}
              onChange={(e) => updateField('negocio_nombre', e.target.value)}
              placeholder="Ferretería El Martillo"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Dirección</label>
            <input
              type="text"
              value={formData.negocio_direccion}
              onChange={(e) => updateField('negocio_direccion', e.target.value)}
              placeholder="Calle 123, Col. Centro"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">RFC</label>
            <input
              type="text"
              value={formData.negocio_rfc}
              onChange={(e) => updateField('negocio_rfc', e.target.value)}
              placeholder="XAXX010101000"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Teléfono (opcional)</label>
            <input
              type="text"
              value={formData.negocio_telefono}
              onChange={(e) => updateField('negocio_telefono', e.target.value)}
              placeholder="555-123-4567"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div className="text-center mb-6">
            <Check className="h-10 w-10 mx-auto mb-2 text-green-500" />
            <h2 className="text-xl font-bold text-slate-900">Resumen</h2>
            <p className="text-sm text-slate-500 mt-1">Revisa la información antes de guardar.</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <h3 className="font-medium text-slate-900">Administrador</h3>
            <div className="text-sm text-slate-600 space-y-1">
              <p><span className="font-medium">Nombre:</span> {formData.nombre_completo}</p>
              <p><span className="font-medium">Email:</span> {formData.email}</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <h3 className="font-medium text-slate-900">Negocio</h3>
            <div className="text-sm text-slate-600 space-y-1">
              <p><span className="font-medium">Nombre:</span> {formData.negocio_nombre}</p>
              <p><span className="font-medium">Dirección:</span> {formData.negocio_direccion}</p>
              <p><span className="font-medium">RFC:</span> {formData.negocio_rfc}</p>
              {formData.negocio_telefono && (
                <p><span className="font-medium">Teléfono:</span> {formData.negocio_telefono}</p>
              )}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        {step > 1 && step < 3 && (
          <button
            onClick={handlePrev}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Anterior
          </button>
        )}
        {step < 3 && (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-all ml-auto"
          >
            Siguiente <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
