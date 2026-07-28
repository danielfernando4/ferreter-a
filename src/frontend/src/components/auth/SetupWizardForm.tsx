import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

interface SetupWizardFormProps {
  onComplete: () => void;
}

export function SetupWizardForm({ onComplete }: SetupWizardFormProps) {
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

  const [success, setSuccess] = useState(false);

  const validateStep1 = () => {
    if (!nombreCompleto.trim()) return 'El nombre es obligatorio';
    if (!email.trim()) return 'El correo es obligatorio';
    if (!password) return 'La contraseña es obligatoria';
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
    const validationError = step === 1 ? validateStep1() : validateStep2();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    const validationError = validateStep2();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { runSetup } = await import('../../services/api');
      await runSetup({
        nombre_completo: nombreCompleto.trim(),
        email: email.trim(),
        password,
        negocio_nombre: negocioNombre.trim(),
        negocio_direccion: negocioDireccion.trim(),
        negocio_rfc: negocioRfc.trim(),
        negocio_telefono: negocioTelefono.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message || 'Error al guardar la configuración inicial');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          ¡Configuración Completada!
        </h3>
        <p className="text-sm text-slate-500">
          Redirigiendo al inicio de sesión...
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 1
              ? 'bg-blue-600 text-white'
              : 'bg-slate-200 text-slate-500'
          }`}
        >
          1
        </div>
        <div
          className={`flex-1 h-0.5 ${
            step >= 2 ? 'bg-blue-600' : 'bg-slate-200'
          }`}
        />
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 2
              ? 'bg-blue-600 text-white'
              : 'bg-slate-200 text-slate-500'
          }`}
        >
          2
        </div>
        <div
          className={`flex-1 h-0.5 ${
            step >= 3 ? 'bg-blue-600' : 'bg-slate-200'
          }`}
        />
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 3
              ? 'bg-blue-600 text-white'
              : 'bg-slate-200 text-slate-500'
          }`}
        >
          3
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 mb-5">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Cuenta de Administrador
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Crea la cuenta de administrador principal del sistema.
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nombre Completo
            </label>
            <input
              type="text"
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              placeholder="Nombre del administrador"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ejemplo.com"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
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
              placeholder="Mínimo 6 caracteres"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la contraseña"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Datos del Negocio
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Ingresa la información de tu establecimiento.
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nombre del Negocio
            </label>
            <input
              type="text"
              value={negocioNombre}
              onChange={(e) => setNegocioNombre(e.target.value)}
              placeholder="Ferretería Ejemplo"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
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
              placeholder="Calle, número, colonia, ciudad"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
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
              placeholder="RFC del negocio"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Teléfono <span className="text-slate-400">(opcional)</span>
            </label>
            <input
              type="text"
              value={negocioTelefono}
              onChange={(e) => setNegocioTelefono(e.target.value)}
              placeholder="Teléfono de contacto"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Resumen de Configuración
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Revisa la información antes de finalizar.
          </p>

          <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Administrador
              </h4>
              <p className="text-sm text-slate-900 mt-1">{nombreCompleto}</p>
              <p className="text-sm text-slate-500">{email}</p>
            </div>
            <div className="border-t border-slate-200 pt-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Negocio
              </h4>
              <p className="text-sm text-slate-900 mt-1">{negocioNombre}</p>
              <p className="text-sm text-slate-500">{negocioDireccion}</p>
              <p className="text-sm text-slate-500">RFC: {negocioRfc}</p>
              {negocioTelefono && (
                <p className="text-sm text-slate-500">Tel: {negocioTelefono}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-8">
        {step > 1 && step <= 3 ? (
          <button
            type="button"
            onClick={() => {
              setStep(step - 1);
              setError('');
            }}
            className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-2xl hover:bg-slate-50 transition-all text-sm font-medium"
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
            className="px-6 py-2.5 bg-blue-600 text-white rounded-2xl shadow-sm hover:bg-blue-700 transition-all text-sm font-medium"
          >
            Siguiente
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2.5 bg-green-600 text-white rounded-2xl shadow-sm hover:bg-green-700 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Finalizar Configuración'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
