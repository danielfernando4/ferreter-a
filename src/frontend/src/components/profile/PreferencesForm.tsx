import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import type { PreferenciasOut } from '../../types/auth';

interface PreferencesFormProps {
  preferencias: PreferenciasOut;
  onSave: (data: Partial<PreferenciasOut>) => Promise<void>;
}

export default function PreferencesForm({ preferencias, onSave }: PreferencesFormProps) {
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
      const data: Partial<PreferenciasOut> = {};
      if (idioma !== preferencias.idioma) data.idioma = idioma;
      if (tema !== preferencias.tema_visual) data.tema_visual = tema;
      if (zonaHoraria !== preferencias.zona_horaria) data.zona_horaria = zonaHoraria;
      if (Object.keys(data).length === 0) {
        setSuccess('Sin cambios para guardar');
        setIsLoading(false);
        return;
      }
      await onSave(data);
      setSuccess('Preferencias actualizadas exitosamente');
    } catch {
      // Error handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-md font-semibold text-slate-900">Preferencias</h3>

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          {success}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Idioma</label>
        <select
          value={idioma}
          onChange={(e) => setIdioma(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm bg-white"
        >
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Tema visual</label>
        <select
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm bg-white"
        >
          <option value="light">Claro</option>
          <option value="dark">Oscuro</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Zona horaria</label>
        <select
          value={zonaHoraria}
          onChange={(e) => setZonaHoraria(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm bg-white"
        >
          <option value="America/Mexico_City">America/Mexico City (UTC-6)</option>
          <option value="America/Argentina/Buenos_Aires">Argentina (UTC-3)</option>
          <option value="America/Bogota">Colombia (UTC-5)</option>
          <option value="America/Lima">Perú (UTC-5)</option>
          <option value="America/Santiago">Chile (UTC-4)</option>
          <option value="America/Madrid">Madrid (UTC+1)</option>
          <option value="UTC">UTC</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {isLoading ? 'Guardando...' : 'Guardar preferencias'}
      </button>
    </form>
  );
}
