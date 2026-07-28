import { useState, type FormEvent } from 'react';
import { Loader2, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { runSetup } from '../../services/api';

interface SetupWizardFormProps {
  onComplete: () => void;
}

export default function SetupWizardForm({ onComplete }: SetupWizardFormProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Admin account
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2: Business info
  const [negocioNombre, setNegocioNombre] = useState('');
  const [negocioDireccion, setNegocioDireccion] = useState('');
  const [negocioRfc, setNegocioRfc] = useState('');
  const [negocioTelefono, setNegocioTelefono] = useState('');

  const isStep1Valid = nombre.trim() && email.trim() && password.length >= 6 && password === confirmPassword;
  const isStep2Valid = negocioNombre.trim() && negocioDireccion.trim() && negocioRfc.trim();

  const handleNext = () => {
    if (step === 1 && isStep1Valid) setStep(2);
    else if (step === 2 && isStep2Valid) setStep(3);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await runSetup({
        nombre_completo: nombre,
        email,
        password,
        negocio_nombre: negocioNombre,
        negocio_direccion: negocioDireccion,
        negocio_rfc: negocioRfc,
        negocio_telefono: negocioTelefono || null,
      });
      onComplete();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar configuración';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg">
      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                s <= step
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              {s < step ? <Check size={16} /> : s}
            </div>
            {s < 3 && (
              <div className={`w-12 h-0.5 ${s < step ? 'bg-slate-900' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">Cuenta de Administrador</h2>
            <p className="text-sm text-slate-500">Crea la cuenta principal del sistema.</p>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none text-sm"
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none text-sm"
                placeholder="admin@ejemplo.com"
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
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none text-sm"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none text-sm"
                placeholder="Repite la contraseña"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">Datos del Negocio</h2>
            <p className="text-sm text-slate-500">Configura los datos de tu establecimiento.</p>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del negocio</label>
              <input
                type="text"
                value={negocioNombre}
                onChange={e => setNegocioNombre(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none text-sm"
                placeholder="Ferretería Ejemplo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
              <input
                type="text"
                value={negocioDireccion}
                onChange={e => setNegocioDireccion(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none text-sm"
                placeholder="Calle, número, colonia, ciudad"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">RFC</label>
              <input
                type="text"
                value={negocioRfc}
                onChange={e => setNegocioRfc(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none text-sm"
                placeholder="RFC del negocio"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono (opcional)</label>
              <input
                type="text"
                value={negocioTelefono}
                onChange={e => setNegocioTelefono(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none text-sm"
                placeholder="Teléfono de contacto"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">Resumen</h2>
            <p className="text-sm text-slate-500">Revisa los datos antes de finalizar.</p>

            <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-sm">
              <div>
                <span className="font-medium text-slate-700">Administrador:</span>
                <p className="text-slate-600">{nombre} ({email})</p>
              </div>
              <div>
                <span className="font-medium text-slate-700">Negocio:</span>
                <p className="text-slate-600">{negocioNombre}</p>
                <p className="text-slate-500">{negocioDireccion}</p>
                <p className="text-slate-500">RFC: {negocioRfc}</p>
                {negocioTelefono && <p className="text-slate-500">Tel: {negocioTelefono}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 size={18} className="animate-spin" />}
              {isLoading ? 'Guardando...' : 'Finalizar configuración'}
            </button>
          </div>
        )}

        {/* Navigation buttons */}
        {step < 3 && (
          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={handlePrev}
              disabled={step === 1}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} /> Anterior
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente <ChevronRight size={18} />
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
