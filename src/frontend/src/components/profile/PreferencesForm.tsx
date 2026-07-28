import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import type { PreferenciasOut, PreferenciasUpdateRequest } from '../../types/auth';
import { updatePreferencias } from '../../services/api';

interface PreferencesFormProps {
  preferencias: PreferenciasOut;
  onSave: (prefs: PreferenciasOut) => void;
}

const idiomas = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
];

const temas = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];

const zonasHorarias = [
  { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
  { value: 'America/Monterrey', label: 'Monterrey (GMT-6)' },
  { value: 'America/Guadalajara', label: 'Guadalajara (GMT-6)' },
  { value: 'America/Tijuana', label: 'Tijuana (GMT-8)' },
  { value: 'America/Merida', label: 'Mérida (GMT-6)' },
  { value: 'America/Chihuahua', label: 'Chihuahua (GMT-7)' },
];

export default function PreferencesForm({ preferencias, onSave }: PreferencesFormProps) {
  const [idioma, setIdioma] = useState(preferencias.idioma);
  const [tema, setTema] = useState(preferencias.tema_visual);
  const [zonaHoraria, setZonaHoraria] = useState(preferencias.zona_horaria);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const data: PreferenciasUpdateRequest = {};
      if (idioma !== preferencias.idioma) data.idioma = idioma;
      if (tema !== preferencias.tema_visual) data.tema_visual = tema;
      if (zonaHoraria !== preferencias.zona_horaria) data.zona_horaria = zonaHoraria;
      if (Object.keys(data).length === 0) {
        onSave(preferencias);
        return;
      }
      const updated = await updatePreferencias(data);
      onSave(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar preferencias';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Idioma</label>
        <select
          value={idioma}
          onChange={e => setIdioma(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none text-sm bg-white"
        >
          {idiomas.map(op => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Tema visual</label>
        <select
          value={tema}
          onChange={e => setTema(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none text-sm bg-white"
        >
          {temas.map(op => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Zona horaria</label>
        <select
          value={zonaHoraria}
          onChange={e => setZonaHoraria(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none text-sm bg-white"
        >
          {zonasHorarias.map(op => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="py-2.5 px-6 rounded-xl bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isLoading && <Loader2 size={18} className="animate-spin" />}
        {isLoading ? 'Guardando...' : 'Guardar preferencias'}
      </button>
    </form>
  );
}
