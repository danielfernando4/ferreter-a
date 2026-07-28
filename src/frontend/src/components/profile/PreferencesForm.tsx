import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { PreferenciasOut } from '../../types/auth';
import { updatePreferencias } from '../../services/api';

interface PreferencesFormProps {
  preferencias: PreferenciasOut;
  onSave: (prefs: PreferenciasOut) => void;
}

export default function PreferencesForm({ preferencias, onSave }: PreferencesFormProps) {
  const [idioma, setIdioma] = useState(preferencias.idioma);
  const [tema, setTema] = useState(preferencias.tema_visual);
  const [zonaHoraria, setZonaHoraria] = useState(preferencias.zona_horaria);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const data: { idioma?: string; tema_visual?: string; zona_horaria?: string } = {};
      if (idioma !== preferencias.idioma) data.idioma = idioma;
      if (tema !== preferencias.tema_visual) data.tema_visual = tema;
      if (zonaHoraria !== preferencias.zona_horaria) data.zona_horaria = zonaHoraria;
      if (Object.keys(data).length === 0) {
        setSuccess('Sin cambios que guardar');
        setIsLoading(false);
        return;
      }
      const updated = await updatePreferencias(data);
      onSave(updated);
      setSuccess('Preferencias actualizadas exitosamente');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar preferencias';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}
      {success && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">{success}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Idioma</label>
        <select
          value={idioma}
          onChange={(e) => setIdioma(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white"
        >
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Tema visual</label>
        <select
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white"
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
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white"
        >
          <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
          <option value="America/Monterrey">Monterrey (GMT-6)</option>
          <option value="America/Guadalajara">Guadalajara (GMT-6)</option>
          <option value="America/Tijuana">Tijuana (GMT-8)</option>
          <option value="America/Cancun">Cancún (GMT-5)</option>
          <option value="America/Merida">Mérida (GMT-6)</option>
          <option value="America/Chihuahua">Chihuahua (GMT-7)</option>
          <option value="America/Hermosillo">Hermosillo (GMT-7)</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition-all flex items-center gap-2"
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {isLoading ? 'Guardando...' : 'Guardar preferencias'}
      </button>
    </form>
  );
}
