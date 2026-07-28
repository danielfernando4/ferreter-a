import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import type { PreferenciasOut } from '../../types/auth';

interface PreferencesFormProps {
  preferencias: PreferenciasOut;
  onSave: (data: { idioma?: string; tema_visual?: string; zona_horaria?: string }) => Promise<void>;
}

export default function PreferencesForm({ preferencias, onSave }: PreferencesFormProps) {
  const [idioma, setIdioma] = useState(preferencias.idioma);
  const [temaVisual, setTemaVisual] = useState(preferencias.tema_visual);
  const [zonaHoraria, setZonaHoraria] = useState(preferencias.zona_horaria);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      const data: { idioma?: string; tema_visual?: string; zona_horaria?: string } = {};
      if (idioma !== preferencias.idioma) data.idioma = idioma;
      if (temaVisual !== preferencias.tema_visual) data.tema_visual = temaVisual;
      if (zonaHoraria !== preferencias.zona_horaria) data.zona_horaria = zonaHoraria;

      if (Object.keys(data).length > 0) {
        await onSave(data);
      }
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar preferencias';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Idioma
        </label>
        <select
          value={idioma}
          onChange={(e) => setIdioma(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm bg-white"
        >
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Tema Visual
        </label>
        <select
          value={temaVisual}
          onChange={(e) => setTemaVisual(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm bg-white"
        >
          <option value="light">Claro</option>
          <option value="dark">Oscuro</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Zona Horaria
        </label>
        <select
          value={zonaHoraria}
          onChange={(e) => setZonaHoraria(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm bg-white"
        >
          <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
          <option value="America/Monterrey">Monterrey (GMT-6)</option>
          <option value="America/Tijuana">Tijuana (GMT-8)</option>
          <option value="America/Cancun">Cancún (GMT-5)</option>
          <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
          <option value="America/Bogota">Bogotá (GMT-5)</option>
          <option value="America/Santiago">Santiago (GMT-4)</option>
          <option value="America/Lima">Lima (GMT-5)</option>
        </select>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          Preferencias actualizadas exitosamente.
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Guardando...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Guardar Preferencias
          </>
        )}
      </button>
    </form>
  );
}
