import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { runSetup } from '../../services/api';
import { Loader2, Check, ArrowRight, ArrowLeft } from 'lucide-react';

interface SetupWizardFormProps {
  onComplete: () => void;
}

interface FormData {
  nombre_completo: string;
  email: string;
  password: string;
  confirmPassword: string;
  negocio_nombre: string;
  negocio_direccion: string;
  negocio_rfc: string;
  negocio_telefono: string;
}

export default function SetupWizardForm({ onComplete }: SetupWizardFormProps) {
  const navigate = useNavigate();
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

  const validateStep1 = () => {
    if (!formData.nombre_completo.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError('Todos los campos son obligatorios');
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

  const validateStep2 = () => {
    if (!formData.negocio_nombre.trim() || !formData.negocio_direccion.trim() || !formData.negocio_rfc.trim()) {
      setError('Todos los campos obligatorios deben estar completos');
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
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    try {
      await runSetup({
        nombre_completo: formData.nombre_completo,
        email: formData.email,
        password: formData.password,
        negocio_nombre: formData.negocio_nombre,
        negocio_direccion: formData.negocio_direccion,
        negocio_rfc: formData.negocio_rfc,
        negocio_telefono: formData.negocio_telefono || null,
      });
      onComplete();
      navigate('/login');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar la configuración inicial';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { num: 1, label: 'Cuenta Admin' },
    { num: 2, label: 'Datos del Negocio' },
    { num: 3, label: 'Resumen' },
  ];

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-8">
        {steps.map((s) => (
          <div key={s.num} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step > s.num
                    ? 'bg-green-500 text-white'
                    : step === s.num
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span className={`text-sm hidden sm:block ${step === s.num ? 'text-blue-700 font-medium' : 'text-slate-500'}`}>
                {s.label}
              </span>
            </div>
            {s.num < 3 && <div className="w-12 h-0.5 mx-2 bg-slate-200" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Cuenta de Administrador</h2>
          <p className="text-sm text-slate-500">Crea la cuenta del administrador principal del sistema.</p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
            <input
              value={formData.nombre_completo}
              onChange={(e) => updateField('nombre_completo', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
              placeholder="Juan Pérez"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
              placeholder="admin@ferreteria.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar contraseña</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
              placeholder="Repite la contraseña"
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Datos del Negocio</h2>
          <p className="text-sm text-slate-500">Configura los datos básicos de tu ferretería.</p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del negocio</label>
            <input
              value={formData.negocio_nombre}
              onChange={(e) => updateField('negocio_nombre', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
              placeholder="Ferretería El Martillo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
            <input
              value={formData.negocio_direccion}
              onChange={(e) => updateField('negocio_direccion', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
              placeholder="Calle Principal #123"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">RFC</label>
            <input
              value={formData.negocio_rfc}
              onChange={(e) => updateField('negocio_rfc', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
              placeholder="RFC del negocio"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono (opcional)</label>
            <input
              value={formData.negocio_telefono}
              onChange={(e) => updateField('negocio_telefono', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
              placeholder="+52 555 123 4567"
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Resumen</h2>
          <p className="text-sm text-slate-500">Revisa la información antes de finalizar.</p>
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <div>
              <span className="text-xs text-slate-500 uppercase font-medium">Administrador</span>
              <p className="text-slate-900 font-medium">{formData.nombre_completo}</p>
              <p className="text-sm text-slate-500">{formData.email}</p>
            </div>
            <div className="border-t border-slate-200 pt-3">
              <span className="text-xs text-slate-500 uppercase font-medium">Negocio</span>
              <p className="text-slate-900 font-medium">{formData.negocio_nombre}</p>
              <p className="text-sm text-slate-500">{formData.negocio_direccion}</p>
              <p className="text-sm text-slate-500">RFC: {formData.negocio_rfc}</p>
              {formData.negocio_telefono && (
                <p className="text-sm text-slate-500">Tel: {formData.negocio_telefono}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-8">
        {step > 1 ? (
          <button
            onClick={handlePrev}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Anterior
          </button>
        ) : (
          <div />
        )}
        {step < 3 ? (
          <button
            onClick={handleNext}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all flex items-center gap-2"
          >
            Siguiente <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium transition-all flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Guardando...' : 'Finalizar configuración'}
          </button>
        )}
      </div>
    </div>
  );
}
