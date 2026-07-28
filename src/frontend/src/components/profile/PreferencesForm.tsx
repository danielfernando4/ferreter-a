import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { PreferenciasOut } from '../../types/auth';

interface PreferencesFormProps {
  preferencias: PreferenciasOut;
  onSave: (data: {
    idioma?: string;
    tema_visual?: string;
    zona_horaria?: string;
  }) => Promise<void>;
}

export function PreferencesForm({ preferencias, onSave }: PreferencesFormProps) {
  const [idioma, setIdioma] = useState(preferencias.idioma || 'es');
  const [temaVisual, setTemaVisual] = useState(
    preferencias.tema_visual || 'light'
  );
  const [zonaHoraria, setZonaHoraria] = useState(
    preferencias.zona_horaria || 'America/Mexico_City'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors('');
    setSuccess(false);

    setIsLoading(true);
    try {
      await onSave({
        idioma,
        tema_visual: temaVisual,
        zona_horaria: zonaHoraria,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setErrors(apiErr?.message || 'Error al guardar las preferencias');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
          {errors}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-2xl text-sm text-green-700">
          Preferencias actualizadas exitosamente
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Idioma
        </label>
        <select
          value={idioma}
          onChange={(e) => setIdioma(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm bg-white"
        >
          <option value="es">Español</option>
          <option value="en">Inglés</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Tema Visual
        </label>
        <select
          value={temaVisual}
          onChange={(e) => setTemaVisual(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm bg-white"
        >
          <option value="light">Claro</option>
          <option value="dark">Oscuro</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Zona Horaria
        </label>
        <select
          value={zonaHoraria}
          onChange={(e) => setZonaHoraria(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm bg-white"
        >
          <option value="America/Mexico_City">
            América/México Ciudad (GMT-6)
          </option>
          <option value="America/Monterrey">
            América/Monterrey (GMT-6)
          </option>
          <option value="America/Guadalajara">
            América/Guadalajara (GMT-6)
          </option>
          <option value="America/Tijuana">
            América/Tijuana (GMT-8)
          </option>
          <option value="America/Cancun">
            América/Cancún (GMT-5)
          </option>
          <option value="America/Argentina/Buenos_Aires">
            América/Argentina/Buenos Aires (GMT-3)
          </option>
          <option value="America/Santiago">
            América/Santiago (GMT-4)
          </option>
          <option value="America/Bogota">
            América/Bogotá (GMT-5)
          </option>
          <option value="America/Lima">
            América/Lima (GMT-5)
          </option>
          <option value="America/Madrid">
            Europa/Madrid (GMT+1)
          </option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 bg-blue-600 text-white rounded-2xl shadow-sm hover:bg-blue-700 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Guardando...
          </>
        ) : (
          'Guardar Preferencias'
        )}
      </button>
    </form>
  );
}
