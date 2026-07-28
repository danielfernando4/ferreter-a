import { useState, type FormEvent } from 'react';
import { Check, Loader2 } from 'lucide-react';
import * as api from '../../services/api';

interface SetupWizardFormProps {
  onComplete: () => void;
}

export default function SetupWizardForm({ onComplete }: SetupWizardFormProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 - Admin account
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2 - Business data
  const [negocioNombre, setNegocioNombre] = useState('');
  const [negocioDireccion, setNegocioDireccion] = useState('');
  const [negocioRfc, setNegocioRfc] = useState('');
  const [negocioTelefono, setNegocioTelefono] = useState('');

  const [stepError, setStepError] = useState('');

  const validateStep1 = () => {
    if (!nombre.trim()) return 'El nombre es obligatorio';
    if (!email.trim()) return 'El correo es obligatorio';
    if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    if (password !== confirmPassword) return 'Las contraseñas no coinciden';
    return '';
  };

  const validateStep2 = () => {
    if (!negocioNombre.trim()) return 'El nombre del negocio es obligatorio';
    if (!negocioDireccion.trim()) return 'La dirección es obligatoria';
    if (!negocioRfc.trim()) return 'El RFC es obligatorio';
    return '';
  };

  const handleNext = () => {
    setStepError('');
    if (step === 1) {
      const err = validateStep1();
      if (err) { setStepError(err); return; }
      setStep(2);
    } else if (step === 2) {
      const err = validateStep2();
      if (err) { setStepError(err); return; }
      setStep(3);
    }
  };

  const handlePrev = () => {
    setStepError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setStepError('');
    setIsLoading(true);
    try {
      await api.runSetup({
        nombre_completo: nombre.trim(),
        email: email.trim(),
        password,
        negocio_nombre: negocioNombre.trim(),
        negocio_direccion: negocioDireccion.trim(),
        negocio_rfc: negocioRfc.trim(),
        negocio_telefono: negocioTelefono.trim() || undefined,
      });
      onComplete();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar configuración inicial';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                step === s
                  ? 'bg-blue-600 text-white'
                  : step > s
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {step > s ? <Check size={16} /> : s}
            </div>
            {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-green-500' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Cuenta de Administrador</h3>
          <p className="text-sm text-slate-500">Crea la cuenta principal del sistema</p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900"
              placeholder="Juan Pérez"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900"
              placeholder="admin@ferreteria.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900"
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Datos del Negocio</h3>
          <p className="text-sm text-slate-500">Configura los datos de tu ferretería</p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del negocio</label>
            <input
              type="text"
              value={negocioNombre}
              onChange={e => setNegocioNombre(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900"
              placeholder="Ferretería El Martillo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
            <input
              type="text"
              value={negocioDireccion}
              onChange={e => setNegocioDireccion(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900"
              placeholder="Calle Principal #123"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">RFC</label>
            <input
              type="text"
              value={negocioRfc}
              onChange={e => setNegocioRfc(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900"
              placeholder="XXXX000000XXX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono (opcional)</label>
            <input
              type="text"
              value={negocioTelefono}
              onChange={e => setNegocioTelefono(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900"
              placeholder="5512345678"
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Resumen</h3>
          <p className="text-sm text-slate-500">Revisa la información antes de finalizar</p>
          <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-sm">
            <div>
              <span className="font-medium text-slate-700">Administrador:</span>
              <p className="text-slate-600">{nombre} — {email}</p>
            </div>
            <div>
              <span className="font-medium text-slate-700">Negocio:</span>
              <p className="text-slate-600">{negocioNombre}</p>
              <p className="text-slate-600">{negocioDireccion}</p>
              <p className="text-slate-600">RFC: {negocioRfc}</p>
              {negocioTelefono && <p className="text-slate-600">Tel: {negocioTelefono}</p>}
            </div>
          </div>
        </div>
      )}

      {stepError && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl border border-red-200">
          {stepError}
        </div>
      )}

      <div className="flex justify-between">
        {step > 1 ? (
          <button
            type="button"
            onClick={handlePrev}
            className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all"
          >
            Anterior
          </button>
        ) : (
          <div />
        )}
        {step < 3 ? (
          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all"
          >
            Siguiente
          </button>
        ) : (
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            {isLoading ? 'Guardando...' : 'Finalizar configuración'}
          </button>
        )}
      </div>
    </form>
  );
}
