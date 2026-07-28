import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../services/api';
import { Loader2, AlertCircle, Check, ArrowRight, ArrowLeft, Store, User } from 'lucide-react';

interface SetupWizardFormProps {
  onComplete?: () => void;
}

export default function SetupWizardForm({ onComplete }: SetupWizardFormProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Admin account
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2: Business data
  const [negocioNombre, setNegocioNombre] = useState('');
  const [negocioDireccion, setNegocioDireccion] = useState('');
  const [negocioRfc, setNegocioRfc] = useState('');
  const [negocioTelefono, setNegocioTelefono] = useState('');

  const validateStep1 = (): string | null => {
    if (!nombreCompleto.trim()) return 'El nombre completo es obligatorio';
    if (!email.trim()) return 'El correo electrónico es obligatorio';
    if (!password) return 'La contraseña es obligatoria';
    if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    if (password !== confirmPassword) return 'Las contraseñas no coinciden';
    return null;
  };

  const validateStep2 = (): string | null => {
    if (!negocioNombre.trim()) return 'El nombre del negocio es obligatorio';
    if (!negocioDireccion.trim()) return 'La dirección es obligatoria';
    if (!negocioRfc.trim()) return 'El RFC es obligatorio';
    return null;
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
      setStep(2);
    } else if (step === 2) {
      const err = validateStep2();
      if (err) { setError(err); return; }
      setStep(3);
    }
  };

  const handleBack = () => {
    setError('');
    setStep((s) => s - 1);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await api.runSetup({
        nombre_completo: nombreCompleto.trim(),
        email: email.trim(),
        password,
        negocio_nombre: negocioNombre.trim(),
        negocio_direccion: negocioDireccion.trim(),
        negocio_rfc: negocioRfc.trim(),
        negocio_telefono: negocioTelefono.trim() || null,
      });
      if (onComplete) onComplete();
      navigate('/login');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la configuración';
      setError(msg);
    }
    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Steps indicator */}
      <div className="flex items-center justify-center mb-8 space-x-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                s === step
                  ? 'bg-slate-900 text-white'
                  : s < step
                  ? 'bg-slate-200 text-slate-500'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {s < step ? <Check className="h-4 w-4" /> : s}
            </div>
            {s < 3 && (
              <div
                className={`w-12 h-0.5 mx-1 ${
                  s < step ? 'bg-slate-900' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          {step === 1 && <User className="h-6 w-6 text-slate-700" />}
          {step === 2 && <Store className="h-6 w-6 text-slate-700" />}
          {step === 3 && <Check className="h-6 w-6 text-slate-700" />}
          <h2 className="text-xl font-semibold text-slate-900">
            {step === 1 && 'Cuenta de Administrador'}
            {step === 2 && 'Datos del Negocio'}
            {step === 3 && 'Resumen y Confirmación'}
          </h2>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()} className="space-y-4">
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
                  placeholder="Juan Pérez"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
                  placeholder="admin@ejemplo.com"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nombre del negocio
                </label>
                <input
                  type="text"
                  value={negocioNombre}
                  onChange={(e) => setNegocioNombre(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
                  placeholder="Ferretería El Martillo"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Dirección
                </label>
                <input
                  type="text"
                  value={negocioDireccion}
                  onChange={(e) => setNegocioDireccion(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
                  placeholder="Calle Principal #123"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  RFC
                </label>
                <input
                  type="text"
                  value={negocioRfc}
                  onChange={(e) => setNegocioRfc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
                  placeholder="XAXX010101000"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Teléfono <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={negocioTelefono}
                  onChange={(e) => setNegocioTelefono(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
                  placeholder="555-123-4567"
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Administrador</h3>
                <p className="text-sm text-slate-600">{nombreCompleto}</p>
                <p className="text-sm text-slate-600">{email}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Negocio</h3>
                <p className="text-sm text-slate-600">{negocioNombre}</p>
                <p className="text-sm text-slate-600">{negocioDireccion}</p>
                <p className="text-sm text-slate-600">RFC: {negocioRfc}</p>
                {negocioTelefono && (
                  <p className="text-sm text-slate-600">Tel: {negocioTelefono}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                Atrás
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-all shadow-sm"
              >
                Siguiente
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {isLoading ? 'Guardando...' : 'Completar configuración'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
