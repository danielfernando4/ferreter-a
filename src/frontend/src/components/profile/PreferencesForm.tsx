import { useState, type FormEvent } from 'react';
import { Save, Loader2 } from 'lucide-react';
import type { PreferenciasOut } from '../../types/auth';
import * as api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

interface PreferencesFormProps {
  preferencias: PreferenciasOut;
  onSave: (prefs: PreferenciasOut) => void;
}

export default function PreferencesForm({ preferencias, onSave }: PreferencesFormProps) {
  const { token } = useAuth();
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
      const updated = await api.updatePreferencias(token!, {
        idioma: idioma !== preferencias.idioma ? idioma : undefined,
        tema_visual: tema !== preferencias.tema_visual ? tema : undefined,
        zona_horaria: zonaHoraria !== preferencias.zona_horaria ? zonaHoraria : undefined,
      });
      onSave(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar preferencias';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <h3 className="text-lg font-semibold text-slate-900">Preferencias</h3>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Idioma</label>
        <select
          value={idioma}
          onChange={e => setIdioma(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 bg-white"
        >
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Tema visual</label>
        <select
          value={tema}
          onChange={e => setTema(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 bg-white"
        >
          <option value="light">Claro</option>
          <option value="dark">Oscuro</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Zona horaria</label>
        <select
          value={zonaHoraria}
          onChange={e => setZonaHoraria(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 bg-white"
        >
          <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
          <option value="America/Monterrey">Monterrey (GMT-6)</option>
          <option value="America/Tijuana">Tijuana (GMT-8)</option>
          <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
          <option value="America/Bogota">Bogotá (GMT-5)</option>
          <option value="America/Santiago">Santiago (GMT-4)</option>
          <option value="Europe/Madrid">Madrid (GMT+1)</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
        {isLoading ? 'Guardando...' : 'Guardar preferencias'}
      </button>
    </form>
  );
}
