import { useState, type FormEvent } from 'react';
import { Save } from 'lucide-react';
import type { PreferenciasOut } from '../../types/auth';

interface PreferencesFormProps {
  preferencias: PreferenciasOut;
  onSave: (data: { idioma: string; tema_visual: string; zona_horaria: string }) => Promise<void>;
}

export function PreferencesForm({ preferencias, onSave }: PreferencesFormProps) {
  const [idioma, setIdioma] = useState(preferencias.idioma || 'es');
  const [tema, setTema] = useState(preferencias.tema_visual || 'light');
  const [zonaHoraria, setZonaHoraria] = useState(preferencias.zona_horaria || 'America/Mexico_City');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    setIsLoading(true);
    try {
      await onSave({ idioma, tema_visual: tema, zona_horaria: zonaHoraria });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError((err as { message: string }).message);
      } else {
        setError('Error al guardar preferencias');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h3 className="text-base font-semibold text-slate-900">Preferencias</h3>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}
      {success && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
          Preferencias actualizadas
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Idioma</label>
        <select
          value={idioma}
          onChange={(e) => setIdioma(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 bg-white"
          disabled={isLoading}
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
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 bg-white"
          disabled={isLoading}
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
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 bg-white"
          disabled={isLoading}
        >
          <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
          <option value="America/Monterrey">Monterrey (GMT-6)</option>
          <option value="America/Tijuana">Tijuana (GMT-8)</option>
          <option value="America/Merida">Mérida (GMT-6)</option>
          <option value="America/Chihuahua">Chihuahua (GMT-7)</option>
          <option value="America/Cancun">Cancún (GMT-5)</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Save className="w-4 h-4" />
            Guardar preferencias
          </>
        )}
      </button>
    </form>
  );
}
