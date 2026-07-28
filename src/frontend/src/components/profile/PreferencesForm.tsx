import { useState, useEffect } from 'react';
import type { PreferenciasOut } from '../../types/auth';
import { perfilApi } from '../../services/api';
import { Loader2, Settings, Save } from 'lucide-react';

interface PreferencesFormProps {
  preferencias: PreferenciasOut;
  onSave: (data: Partial<PreferenciasOut>) => Promise<void>;
}

export default function PreferencesForm({ preferencias, onSave }: PreferencesFormProps) {
  const [idioma, setIdioma] = useState('es');
  const [temaVisual, setTemaVisual] = useState('light');
  const [zonaHoraria, setZonaHoraria] = useState('America/Mexico_City');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setIdioma(preferencias.idioma);
    setTemaVisual(preferencias.tema_visual);
    setZonaHoraria(preferencias.zona_horaria);
  }, [preferencias]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setSuccess(false);
    try {
      const data: Partial<PreferenciasOut> = {};
      if (idioma !== preferencias.idioma) data.idioma = idioma;
      if (temaVisual !== preferencias.tema_visual) data.tema_visual = temaVisual;
      if (zonaHoraria !== preferencias.zona_horaria) data.zona_horaria = zonaHoraria;
      if (Object.keys(data).length > 0) {
        await onSave(data);
      }
      setSuccess(true);
    } catch {
      // Error handled by parent
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
        <Settings className="h-4 w-4 text-slate-500" />
        Preferencias
      </h3>

      {success && (
        <div className="rounded-2xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Preferencias actualizadas
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Idioma</label>
        <select
          value={idioma}
          onChange={(e) => setIdioma(e.target.value)}
          className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-white"
          disabled={isLoading}
        >
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Tema visual</label>
        <select
          value={temaVisual}
          onChange={(e) => setTemaVisual(e.target.value)}
          className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-white"
          disabled={isLoading}
        >
          <option value="light">Claro</option>
          <option value="dark">Oscuro</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Zona horaria</label>
        <select
          value={zonaHoraria}
          onChange={(e) => setZonaHoraria(e.target.value)}
          className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-white"
          disabled={isLoading}
        >
          <option value="America/Mexico_City">America/Mexico City (UTC-6)</option>
          <option value="America/Argentina/Buenos_Aires">America/Argentina/Buenos Aires (UTC-3)</option>
          <option value="America/Bogota">America/Bogota (UTC-5)</option>
          <option value="America/Santiago">America/Santiago (UTC-4)</option>
          <option value="America/Lima">America/Lima (UTC-5)</option>
          <option value="America/Montevideo">America/Montevideo (UTC-3)</option>
          <option value="America/Asuncion">America/Asuncion (UTC-4)</option>
          <option value="America/Panama">America/Panama (UTC-5)</option>
          <option value="America/Havana">America/Havana (UTC-5)</option>
          <option value="America/Santo_Domingo">America/Santo Domingo (UTC-4)</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-all"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {isLoading ? 'Guardando...' : 'Guardar preferencias'}
      </button>
    </form>
  );
}
