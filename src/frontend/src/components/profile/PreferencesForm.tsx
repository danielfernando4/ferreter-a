import { useState } from 'react';
import type { PreferenciasOut } from '../../types/auth';
import * as api from '../../services/api';
import { Loader2 } from 'lucide-react';

interface PreferencesFormProps {
  preferencias: PreferenciasOut;
  onSave: (data: PreferenciasOut) => void;
}

export default function PreferencesForm({ preferencias, onSave }: PreferencesFormProps) {
  const [idioma, setIdioma] = useState(preferencias.idioma);
  const [temaVisual, setTemaVisual] = useState(preferencias.tema_visual);
  const [zonaHoraria, setZonaHoraria] = useState(preferencias.zona_horaria);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const updated = await api.updatePreferencias({
        idioma,
        tema_visual: temaVisual,
        zona_horaria: zonaHoraria,
      });
      onSave(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Preferencias</h3>

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          Preferencias actualizadas exitosamente.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Idioma</label>
        <select
          value={idioma}
          onChange={(e) => setIdioma(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 bg-white"
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
          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 bg-white"
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
          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 bg-white"
        >
          <option value="America/Mexico_City">Ciudad de México (UTC-6)</option>
          <option value="America/Chihuahua">Chihuahua (UTC-7)</option>
          <option value="America/Tijuana">Tijuana (UTC-8)</option>
          <option value="America/Merida">Mérida (UTC-6)</option>
          <option value="America/Monterrey">Monterrey (UTC-6)</option>
          <option value="America/Argentina/Buenos_Aires">Buenos Aires (UTC-3)</option>
          <option value="America/Bogota">Bogotá (UTC-5)</option>
          <option value="America/Lima">Lima (UTC-5)</option>
          <option value="America/Santiago">Santiago (UTC-4)</option>
          <option value="America/Panama">Panamá (UTC-5)</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
      >
        {isLoading ? <Loader2 size={20} className="animate-spin" /> : null}
        {isLoading ? 'Guardando...' : 'Guardar preferencias'}
      </button>
    </form>
  );
}
