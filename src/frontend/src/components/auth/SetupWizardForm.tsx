import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { runSetup } from '../../services/api';
import { Loader2, Check, ArrowLeft, ArrowRight } from 'lucide-react';

interface SetupWizardFormProps {
  onComplete: () => void;
}

export default function SetupWizardForm({ onComplete }: SetupWizardFormProps) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    // Step 1: Admin account
    nombre_completo: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Step 2: Business data
    negocio_nombre: '',
    negocio_direccion: '',
    negocio_rfc: '',
    negocio_telefono: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isStep1Valid = () => {
    return (
      formData.nombre_completo.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.password.length >= 6 &&
      formData.password === formData.confirmPassword
    );
  };

  const isStep2Valid = () => {
    return (
      formData.negocio_nombre.trim() !== '' &&
      formData.negocio_direccion.trim() !== '' &&
      formData.negocio_rfc.trim() !== ''
    );
  };

  const handleNext = () => {
    if (step === 1 && isStep1Valid()) {
      setStep(2);
    }
  };

  const handlePrev = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleSubmit = async () => {
    if (!isStep2Valid()) return;
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
        negocio_telefono: formData.negocio_telefono || null,
      });

      onComplete();
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Error al guardar la configuración inicial');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
          }`}>
            {step > 1 ? <Check className="w-4 h-4" /> : 1}
          </div>
          <span className="text-sm font-medium hidden sm:inline">Admin</span>
        </div>
        <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
          }`}>
            {step > 2 ? <Check className="w-4 h-4" /> : 2}
          </div>
          <span className="text-sm font-medium hidden sm:inline">Negocio</span>
        </div>
        <div className={`w-12 h-0.5 ${step >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`} />
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-600' : 'text-slate-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
          }`}>
            3
          </div>
          <span className="text-sm font-medium hidden sm:inline">Resumen</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        {/* Step 1: Admin Account */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Cuenta de Administrador</h3>
            <p className="text-sm text-slate-500 mb-4">Crea la cuenta de administrador principal del sistema.</p>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
              <input
                type="text"
                value={formData.nombre_completo}
                onChange={(e) => updateField('nombre_completo', e.target.value)}
                placeholder="Juan Pérez"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="admin@ejemplo.com"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar contraseña</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                placeholder="Repite la contraseña"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">Las contraseñas no coinciden</p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Business Data */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Datos del Negocio</h3>
            <p className="text-sm text-slate-500 mb-4">Configura los datos básicos de tu ferretería.</p>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del negocio</label>
              <input
                type="text"
                value={formData.negocio_nombre}
                onChange={(e) => updateField('negocio_nombre', e.target.value)}
                placeholder="Ferretería El Martillo"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
              <input
                type="text"
                value={formData.negocio_direccion}
                onChange={(e) => updateField('negocio_direccion', e.target.value)}
                placeholder="Calle Principal #123, Col. Centro"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">RFC</label>
              <input
                type="text"
                value={formData.negocio_rfc}
                onChange={(e) => updateField('negocio_rfc', e.target.value)}
                placeholder="XAXX010101000"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono (opcional)</label>
              <input
                type="text"
                value={formData.negocio_telefono}
                onChange={(e) => updateField('negocio_telefono', e.target.value)}
                placeholder="+52 55 1234 5678"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>
        )}

        {/* Step 3: Summary */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Resumen de Configuración</h3>
            <p className="text-sm text-slate-500 mb-4">Revisa la información antes de finalizar.</p>

            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Administrador</p>
                <p className="text-sm text-slate-900">{formData.nombre_completo}</p>
                <p className="text-sm text-slate-600">{formData.email}</p>
              </div>
              <div className="border-t border-slate-200 pt-3">
                <p className="text-xs text-slate-500 uppercase font-semibold">Negocio</p>
                <p className="text-sm text-slate-900">{formData.negocio_nombre}</p>
                <p className="text-sm text-slate-600">{formData.negocio_direccion}</p>
                <p className="text-sm text-slate-600">RFC: {formData.negocio_rfc}</p>
                {formData.negocio_telefono && (
                  <p className="text-sm text-slate-600">Tel: {formData.negocio_telefono}</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando configuración...
                </>
              ) : (
                'Finalizar configuración'
              )}
            </button>
          </div>
        )}

        {/* Navigation buttons */}
        {step !== 3 && (
          <div className="flex justify-between mt-6 pt-4 border-t border-slate-200">
            {step === 2 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Anterior
              </button>
            ) : (
              <div />
            )}
            {step === 1 && (
              <button
                type="button"
                onClick={handleNext}
                disabled={!isStep1Valid()}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                Siguiente
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!isStep2Valid()}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                Revisar
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
