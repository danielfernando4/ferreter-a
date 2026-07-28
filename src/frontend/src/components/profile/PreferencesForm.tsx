import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { PreferenciasOut } from '../../types/auth';

interface PreferencesFormProps {
  preferencias: PreferenciasOut;
  onSave: (data: { idioma?: string; tema_visual?: string; zona_horaria?: string }) => Promise<void>;
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
  { value: 'America/Merida', label: 'Mérida (GMT-6)' },
  { value: 'America/Chihuahua', label: 'Chihuahua (GMT-7)' },
];

export function PreferencesForm({ preferencias, onSave }: PreferencesFormProps) {
  const [idioma, setIdioma] = useState(preferencias.idioma);
  const [tema, setTema] = useState(preferencias.tema_visual);
  const [zonaHoraria, setZonaHoraria] = useState(preferencias.zona_horaria);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccess('');
    try {
      const data: { idioma?: string; tema_visual?: string; zona_horaria?: string } = {};
      if (idioma !== preferencias.idioma) data.idioma = idioma;
      if (tema !== preferencias.tema_visual) data.tema_visual = tema;
      if (zonaHoraria !== preferencias.zona_horaria) data.zona_horaria = zonaHoraria;
      if (Object.keys(data).length > 0) {
        await onSave(data);
      }
      setSuccess('Preferencias actualizadas exitosamente');
    } catch {
      setSuccess('Error al guardar preferencias');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h4 className="font-medium text-slate-900">Preferencias</h4>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl text-sm">
          {success}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Idioma</label>
        <select
          value={idioma}
          onChange={(e) => setIdioma(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
        >
          {idiomas.map((i) => (
            <option key={i.value} value={i.value}>{i.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Tema visual</label>
        <select
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
        >
          {temas.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Zona horaria</label>
        <select
          value={zonaHoraria}
          onChange={(e) => setZonaHoraria(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
        >
          {zonasHorarias.map((z) => (
            <option key={z.value} value={z.value}>{z.label}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="px-6 py-2.5 bg-blue-600 text-white rounded-2xl shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all text-sm font-medium flex items-center gap-2"
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {isLoading ? 'Guardando...' : 'Guardar preferencias'}
      </button>
    </form>
  );
}
