import { useState, type FormEvent } from 'react';
import { Settings, AlertCircle, CheckCircle } from 'lucide-react';
import type { PreferenciasOut } from '../../types/auth';
import * as api from '../../services/api';

interface PreferencesFormProps {
  preferencias: PreferenciasOut;
  onSave: (prefs: PreferenciasOut) => void;
}

const idiomas = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'Inglés' },
];

const temas = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];

const zonasHorarias = [
  { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
  { value: 'America/Monterrey', label: 'Monterrey (GMT-6)' },
  { value: 'America/Tijuana', label: 'Tijuana (GMT-8)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
  { value: 'America/Bogota', label: 'Bogotá (GMT-5)' },
  { value: 'America/Santiago', label: 'Santiago (GMT-4)' },
  { value: 'Europe/Madrid', label: 'Madrid (GMT+1)' },
];

export default function PreferencesForm({
  preferencias,
  onSave,
}: PreferencesFormProps) {
  const [idioma, setIdioma] = useState(preferencias.idioma);
  const [temaVisual, setTemaVisual] = useState(preferencias.tema_visual);
  const [zonaHoraria, setZonaHoraria] = useState(preferencias.zona_horaria);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);
    try {
      const updated = await api.updatePreferencias({
        idioma,
        tema_visual: temaVisual,
        zona_horaria: zonaHoraria,
      });
      onSave(updated);
      setSuccess(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al guardar preferencias';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-green-50 text-green-700 text-sm">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>Preferencias actualizadas exitosamente.</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Idioma
        </label>
        <select
          value={idioma}
          onChange={(e) => setIdioma(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        >
          {idiomas.map((i) => (
            <option key={i.value} value={i.value}>
              {i.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Tema Visual
        </label>
        <select
          value={temaVisual}
          onChange={(e) => setTemaVisual(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        >
          {temas.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Zona Horaria
        </label>
        <select
          value={zonaHoraria}
          onChange={(e) => setZonaHoraria(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        >
          {zonasHorarias.map((z) => (
            <option key={z.value} value={z.value}>
              {z.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
        ) : (
          <>
            <Settings className="w-5 h-5" />
            Guardar Preferencias
          </>
        )}
      </button>
    </form>
  );
}
