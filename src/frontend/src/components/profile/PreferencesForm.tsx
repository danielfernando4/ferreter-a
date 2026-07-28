import React, { useState } from 'react';
import { Loader2, Globe, Save } from 'lucide-react';
import { PreferenciasOut } from '../../services/api';

interface PreferencesFormProps {
  preferencias: PreferenciasOut;
  onSave: (data: {
    idioma?: string;
    tema_visual?: string;
    zona_horaria?: string;
  }) => Promise<void>;
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
  { value: 'America/Mexico_City', label: 'Ciudad de México' },
  { value: 'America/Monterrey', label: 'Monterrey' },
  { value: 'America/Tijuana', label: 'Tijuana' },
  { value: 'America/Guadalajara', label: 'Guadalajara' },
  { value: 'America/Hermosillo', label: 'Hermosillo' },
  { value: 'America/Merida', label: 'Mérida' },
];

export default function PreferencesForm({ preferencias, onSave }: PreferencesFormProps) {
  const [idioma, setIdioma] = useState(preferencias.idioma || 'es');
  const [temaVisual, setTemaVisual] = useState(preferencias.tema_visual || 'light');
  const [zonaHoraria, setZonaHoraria] = useState(preferencias.zona_horaria || 'America/Mexico_City');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccess('');
    try {
      const data: { idioma?: string; tema_visual?: string; zona_horaria?: string } = {};
      if (idioma !== preferencias.idioma) data.idioma = idioma;
      if (temaVisual !== preferencias.tema_visual) data.tema_visual = temaVisual;
      if (zonaHoraria !== preferencias.zona_horaria) data.zona_horaria = zonaHoraria;
      if (Object.keys(data).length > 0) {
        await onSave(data);
      }
      setSuccess('Preferencias actualizadas exitosamente');
    } catch (err: any) {
      // Error is handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-indigo-100 rounded-xl">
          <Globe className="text-indigo-600" size={24} />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Preferencias</h3>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Idioma
        </label>
        <select
          value={idioma}
          onChange={(e) => setIdioma(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900"
          disabled={isLoading}
        >
          {idiomas.map((i) => (
            <option key={i.value} value={i.value}>{i.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Tema visual
        </label>
        <select
          value={temaVisual}
          onChange={(e) => setTemaVisual(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900"
          disabled={isLoading}
        >
          {temas.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Zona horaria
        </label>
        <select
          value={zonaHoraria}
          onChange={(e) => setZonaHoraria(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900"
          disabled={isLoading}
        >
          {zonasHorarias.map((z) => (
            <option key={z.value} value={z.value}>{z.label}</option>
          ))}
        </select>
      </div>

      {success && (
        <div className="bg-green-50 text-green-600 text-sm px-4 py-2 rounded-xl border border-green-200">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all font-medium"
      >
        {isLoading ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <Save size={18} />
        )}
        {isLoading ? 'Guardando...' : 'Guardar preferencias'}
      </button>
    </form>
  );
}
