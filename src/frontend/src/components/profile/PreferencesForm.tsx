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
  const [temaVisual, setTemaVisual] = useState(preferencias.tema_visual);
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
      const updated = await updatePreferencias({
        idioma,
        tema_visual: temaVisual,
        zona_horaria: zonaHoraria,
      });
      onSave(updated);
      setSuccess('Preferencias actualizadas exitosamente');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar preferencias';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const selectClass = "w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-sm bg-white";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h3 className="text-lg font-semibold text-slate-900">Preferencias</h3>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700">{success}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Idioma</label>
        <select value={idioma} onChange={(e) => setIdioma(e.target.value)} className={selectClass}>
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Tema visual</label>
        <select value={temaVisual} onChange={(e) => setTemaVisual(e.target.value)} className={selectClass}>
          <option value="light">Claro</option>
          <option value="dark">Oscuro</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Zona horaria</label>
        <select value={zonaHoraria} onChange={(e) => setZonaHoraria(e.target.value)} className={selectClass}>
          <option value="America/Mexico_City">América/México Ciudad</option>
          <option value="America/Monterrey">América/Monterrey</option>
          <option value="America/Guadalajara">América/Guadalajara</option>
          <option value="America/Tijuana">América/Tijuana</option>
          <option value="America/Argentina/Buenos_Aires">América/Argentina/Buenos Aires</option>
          <option value="America/Santiago">América/Santiago</option>
          <option value="America/Lima">América/Lima</option>
          <option value="America/Bogota">América/Bogotá</option>
          <option value="America/Panama">América/Panamá</option>
          <option value="Europe/Madrid">Europa/Madrid</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="py-2.5 px-6 rounded-xl bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {isLoading ? 'Guardando...' : 'Guardar preferencias'}
      </button>
    </form>
  );
}
