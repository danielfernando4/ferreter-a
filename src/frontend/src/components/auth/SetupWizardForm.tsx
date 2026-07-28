import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Check, ChevronRight, ChevronLeft, User } from 'lucide-react';
import * as api from '../../services/api';

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

interface SetupWizardFormProps {
  onComplete: () => void;
}

export function SetupWizardForm({ onComplete }: SetupWizardFormProps) {
  const navigate = useNavigate();
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
    if (formData.password !== formData.confirm_password) {
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

  const handlePrev = () => {
    setError('');
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: FormEvent) => {
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
      navigate('/login', { replace: true });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'status' in err) {
        const apiErr = err as { status: number; message: string };
        if (apiErr.status === 409) {
          setError('La configuración inicial ya fue completada');
        } else {
          setError(apiErr.message || 'Error al guardar la configuración');
        }
      } else {
        setError('Error al conectar con el servidor');
      }
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
                s === step
                  ? 'bg-blue-600 text-white'
                  : s < step
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {s < step ? <Check className="w-4 h-4" /> : s}
            </div>
            {s < 3 && (
              <div
                className={`w-8 h-0.5 ${
                  s < step ? 'bg-green-500' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Cuenta de Administrador</h2>
                <p className="text-sm text-slate-500">Cree la cuenta principal del sistema</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre completo</label>
              <input
                type="text"
                value={formData.nombre_completo}
                onChange={(e) => updateField('nombre_completo', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900"
                placeholder="Nombre del administrador"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo electrónico</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900"
                placeholder="admin@ejemplo.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900"
                placeholder="Mínimo 6 caracteres"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirmar contraseña</label>
              <input
                type="password"
                value={formData.confirm_password}
                onChange={(e) => updateField('confirm_password', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900"
                placeholder="Repita la contraseña"
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-green-100 text-green-600">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Datos del Negocio</h2>
                <p className="text-sm text-slate-500">Configure los datos de su establecimiento</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre del negocio</label>
              <input
                type="text"
                value={formData.negocio_nombre}
                onChange={(e) => updateField('negocio_nombre', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900"
                placeholder="Ferretería"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Dirección</label>
              <input
                type="text"
                value={formData.negocio_direccion}
                onChange={(e) => updateField('negocio_direccion', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900"
                placeholder="Calle, número, colonia, ciudad"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">RFC</label>
              <input
                type="text"
                value={formData.negocio_rfc}
                onChange={(e) => updateField('negocio_rfc', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900"
                placeholder="RFC del negocio"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Teléfono (opcional)</label>
              <input
                type="text"
                value={formData.negocio_telefono}
                onChange={(e) => updateField('negocio_telefono', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900"
                placeholder="Teléfono del negocio"
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Resumen</h2>
                <p className="text-sm text-slate-500">Verifique los datos antes de finalizar</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <h3 className="font-medium text-slate-900">Cuenta de Administrador</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-slate-500">Nombre:</span>
                <span className="text-slate-900 font-medium">{formData.nombre_completo}</span>
                <span className="text-slate-500">Email:</span>
                <span className="text-slate-900 font-medium">{formData.email}</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <h3 className="font-medium text-slate-900">Datos del Negocio</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-slate-500">Nombre:</span>
                <span className="text-slate-900 font-medium">{formData.negocio_nombre}</span>
                <span className="text-slate-500">Dirección:</span>
                <span className="text-slate-900 font-medium">{formData.negocio_direccion}</span>
                <span className="text-slate-500">RFC:</span>
                <span className="text-slate-900 font-medium">{formData.negocio_rfc}</span>
                {formData.negocio_telefono && (
                  <>
                    <span className="text-slate-500">Teléfono:</span>
                    <span className="text-slate-900 font-medium">{formData.negocio_telefono}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50"
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
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Finalizar
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
