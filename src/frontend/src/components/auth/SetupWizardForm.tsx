import { useState } from 'react';
import * as api from '../../services/api';
import { ApiError } from '../../services/api';
import { Loader2, Check, ChevronLeft, ChevronRight } from 'lucide-react';

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

  const canGoNext = () => {
    if (step === 1) {
      return (
        formData.nombre_completo.trim() !== '' &&
        formData.email.trim() !== '' &&
        formData.password.trim() !== '' &&
        formData.password === formData.confirmPassword &&
        formData.password.length >= 6
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
  };

  const handleSubmit = async () => {
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
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError('La configuración inicial ya fue completada.');
        } else {
          setError(err.message || 'Error al guardar la configuración inicial.');
        }
      } else {
        setError('Error de conexión. Intenta de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-xl mx-auto">
      {/* Steps indicator */}
      <div className="flex items-center justify-center mb-8 gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                s < step
                  ? 'bg-green-500 text-white'
                  : s === step
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {s < step ? <Check size={16} /> : s}
            </div>
            {s < 3 && (
              <div
                className={`w-10 h-0.5 ${
                  s < step ? 'bg-green-500' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Cuenta de administrador</h2>
          <p className="text-sm text-slate-500">Crea la cuenta principal del sistema</p>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
            <input
              type="text"
              value={formData.nombre_completo}
              onChange={(e) => updateField('nombre_completo', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900"
              placeholder="Ej. Juan Pérez"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900"
              placeholder="admin@ferreteria.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900"
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar contraseña</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 ${
                formData.confirmPassword && formData.password !== formData.confirmPassword
                  ? 'border-red-400'
                  : 'border-slate-300'
              }`}
              placeholder="Repite la contraseña"
              required
            />
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Datos del negocio</h2>
          <p className="text-sm text-slate-500">Configura los datos de tu ferretería</p>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del negocio</label>
            <input
              type="text"
              value={formData.negocio_nombre}
              onChange={(e) => updateField('negocio_nombre', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900"
              placeholder="Ej. Ferretería El Tornillo"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
            <input
              type="text"
              value={formData.negocio_direccion}
              onChange={(e) => updateField('negocio_direccion', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900"
              placeholder="Calle, número, colonia, ciudad"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">RFC</label>
            <input
              type="text"
              value={formData.negocio_rfc}
              onChange={(e) => updateField('negocio_rfc', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900"
              placeholder="RFC del negocio"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono (opcional)</label>
            <input
              type="text"
              value={formData.negocio_telefono}
              onChange={(e) => updateField('negocio_telefono', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900"
              placeholder="+52 55 1234 5678"
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Resumen</h2>
          <p className="text-sm text-slate-500">Verifica los datos antes de finalizar</p>

          <div className="bg-slate-50 rounded-xl p-5 space-y-3">
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Administrador</p>
              <p className="text-slate-900 font-medium">{formData.nombre_completo}</p>
              <p className="text-sm text-slate-600">{formData.email}</p>
            </div>
            <div className="border-t border-slate-200 pt-3">
              <p className="text-xs text-slate-500 uppercase font-medium">Negocio</p>
              <p className="text-slate-900 font-medium">{formData.negocio_nombre}</p>
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
      <div className="flex justify-between mt-8">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-1 px-4 py-2.5 text-slate-600 hover:text-slate-900 transition-all"
          >
            <ChevronLeft size={18} />
            Anterior
          </button>
        ) : (
          <div />
        )}

        {step < 3 ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            disabled={!canGoNext()}
            className="flex items-center gap-1 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition-all"
          >
            Siguiente
            <ChevronRight size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-xl transition-all"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            {isLoading ? 'Guardando...' : 'Finalizar configuración'}
          </button>
        )}
      </div>
    </div>
  );
}
