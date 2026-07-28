import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import type { PreferenciasOut } from '../../types/auth';

interface PreferencesFormProps {
  preferencias: PreferenciasOut;
  onSave: (data: { idioma?: string; tema_visual?: string; zona_horaria?: string }) => Promise<void>;
}

const IDIOMAS = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
];

const TEMAS = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];

const ZONAS_HORARIAS = [
  { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
  { value: 'America/Monterrey', label: 'Monterrey (GMT-6)' },
  { value: 'America/Tijuana', label: 'Tijuana (GMT-8)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
  { value: 'America/Santiago', label: 'Santiago (GMT-4)' },
  { value: 'America/Bogota', label: 'Bogotá (GMT-5)' },
  { value: 'America/Lima', label: 'Lima (GMT-5)' },
  { value: 'America/Caracas', label: 'Caracas (GMT-4)' },
];

export default function PreferencesForm({ preferencias, onSave }: PreferencesFormProps) {
  const [idioma, setIdioma] = useState('es');
  const [temaVisual, setTemaVisual] = useState('light');
  const [zonaHoraria, setZonaHoraria] = useState('America/Mexico_City');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (preferencias) {
      setIdioma(preferencias.idioma || 'es');
      setTemaVisual(preferencias.tema_visual || 'light');
      setZonaHoraria(preferencias.zona_horaria || 'America/Mexico_City');
    }
  }, [preferencias]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const data: { idioma?: string; tema_visual?: string; zona_horaria?: string } = {};
    if (idioma !== preferencias.idioma) data.idioma = idioma;
    if (temaVisual !== preferencias.tema_visual) data.tema_visual = temaVisual;
    if (zonaHoraria !== preferencias.zona_horaria) data.zona_horaria = zonaHoraria;
    if (Object.keys(data).length === 0) {
      setError('No hay cambios para guardar.');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(data);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Error al guardar las preferencias.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h3 className="text-lg font-semibold text-slate-900">Preferencias</h3>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-600 text-sm px-4 py-3 rounded-xl border border-green-200">
          Preferencias actualizadas exitosamente.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Idioma</label>
        <select
          value={idioma}
          onChange={(e) => setIdioma(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-white"
        >
          {IDIOMAS.map((i) => (
            <option key={i.value} value={i.value}>{i.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Tema visual</label>
        <div className="flex gap-3">
          {TEMAS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTemaVisual(t.value)}
              className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                temaVisual === t.value
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Zona horaria</label>
        <select
          value={zonaHoraria}
          onChange={(e) => setZonaHoraria(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-white"
        >
          {ZONAS_HORARIAS.map((z) => (
            <option key={z.value} value={z.value}>{z.label}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {isLoading ? 'Guardando...' : 'Guardar preferencias'}
      </button>
    </form>
  );
}
