import { useState, useEffect } from 'react';
import type { PreferenciasOut } from '../../types/auth';
import { Loader2 } from 'lucide-react';

interface PreferencesFormProps {
  preferencias: PreferenciasOut;
  onSave: (data: { idioma?: string; tema_visual?: string; zona_horaria?: string }) => Promise<void>;
}

const IDIOMAS = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
];

const TEMAS = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];

const ZONAS_HORARIAS = [
  { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
  { value: 'America/Monterrey', label: 'Monterrey (GMT-6)' },
  { value: 'America/Tijuana', label: 'Tijuana (GMT-8)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
  { value: 'America/Bogota', label: 'Bogotá (GMT-5)' },
  { value: 'America/Lima', label: 'Lima (GMT-5)' },
  { value: 'America/Santiago', label: 'Santiago (GMT-4)' },
];

export default function PreferencesForm({ preferencias, onSave }: PreferencesFormProps) {
  const [idioma, setIdioma] = useState('es');
  const [temaVisual, setTemaVisual] = useState('light');
  const [zonaHoraria, setZonaHoraria] = useState('America/Mexico_City');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setIdioma(preferencias.idioma || 'es');
    setTemaVisual(preferencias.tema_visual || 'light');
    setZonaHoraria(preferencias.zona_horaria || 'America/Mexico_City');
  }, [preferencias]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccess(false);

    try {
      await onSave({
        idioma,
        tema_visual: temaVisual,
        zona_horaria: zonaHoraria,
      });
      setSuccess(true);
    } catch {
      // error handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-base font-semibold text-slate-900">Preferencias</h3>

      {success && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700">
          Preferencias actualizadas exitosamente
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Idioma</label>
        <select
          value={idioma}
          onChange={(e) => setIdioma(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        >
          {IDIOMAS.map((i) => (
            <option key={i.value} value={i.value}>{i.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Tema visual</label>
        <select
          value={temaVisual}
          onChange={(e) => setTemaVisual(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        >
          {TEMAS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Zona horaria</label>
        <select
          value={zonaHoraria}
          onChange={(e) => setZonaHoraria(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        >
          {ZONAS_HORARIAS.map((z) => (
            <option key={z.value} value={z.value}>{z.label}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Guardando...
          </>
        ) : (
          'Guardar preferencias'
        )}
      </button>
    </form>
  );
}
