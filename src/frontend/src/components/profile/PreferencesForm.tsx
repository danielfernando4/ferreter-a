import { useState } from 'react';
import type { PreferenciasOut, PreferenciasUpdateRequest } from '../../types/auth';
import { Save } from 'lucide-react';
import * as api from '../../services/api';

interface PreferencesFormProps {
  preferencias: PreferenciasOut;
  onSave: (data: PreferenciasUpdateRequest) => Promise<void>;
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
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      const data: PreferenciasUpdateRequest = {};
      if (idioma !== preferencias.idioma) data.idioma = idioma;
      if (tema !== preferencias.tema_visual) data.tema_visual = tema;
      if (zonaHoraria !== preferencias.zona_horaria) data.zona_horaria = zonaHoraria;
      if (Object.keys(data).length === 0) {
        setIsLoading(false);
        return;
      }
      await onSave(data);
      setSuccess('Preferencias actualizadas exitosamente');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al guardar las preferencias');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700">
          {success}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Idioma</label>
        <select
          value={idioma}
          onChange={(e) => setIdioma(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        >
          {idiomas.map((i) => (
            <option key={i.value} value={i.value}>
              {i.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Tema visual</label>
        <select
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        >
          {temas.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Zona horaria</label>
        <select
          value={zonaHoraria}
          onChange={(e) => setZonaHoraria(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        >
          {zonasHorarias.map((z) => (
            <option key={z.value} value={z.value}>
              {z.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-all"
        >
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4" />
              Guardar preferencias
            </>
          )}
        </button>
      </div>
    </form>
  );
}
