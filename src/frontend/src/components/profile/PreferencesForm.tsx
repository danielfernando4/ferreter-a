import React, { useState, useEffect } from 'react';
import { Loader2, Settings } from 'lucide-react';
import type { PreferenciasOut } from '../../types/auth';

interface PreferencesFormProps {
  preferencias: PreferenciasOut;
  onSave: (data: {
    idioma?: string;
    tema_visual?: string;
    zona_horaria?: string;
  }) => Promise<void>;
}

const PreferencesForm: React.FC<PreferencesFormProps> = ({ preferencias, onSave }) => {
  const [idioma, setIdioma] = useState('es');
  const [temaVisual, setTemaVisual] = useState('light');
  const [zonaHoraria, setZonaHoraria] = useState('America/Mexico_City');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (preferencias) {
      setIdioma(preferencias.idioma || 'es');
      setTemaVisual(preferencias.tema_visual || 'light');
      setZonaHoraria(preferencias.zona_horaria || 'America/Mexico_City');
    }
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
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      // error handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <Settings className="w-4 h-4" />
        Preferencias
      </h4>

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-600">
          Preferencias actualizadas exitosamente.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Idioma</label>
        <select
          value={idioma}
          onChange={(e) => setIdioma(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm bg-white"
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
          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm bg-white"
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
          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm bg-white"
        >
          <option value="America/Mexico_City">America/Mexico City (UTC-6)</option>
          <option value="America/Chihuahua">America/Chihuahua (UTC-7)</option>
          <option value="America/Cancun">America/Cancun (UTC-5)</option>
          <option value="America/Monterrey">America/Monterrey (UTC-6)</option>
          <option value="America/Tijuana">America/Tijuana (UTC-8)</option>
          <option value="America/Argentina/Buenos_Aires">America/Argentina/Buenos_Aires (UTC-3)</option>
          <option value="America/Bogota">America/Bogota (UTC-5)</option>
          <option value="America/Lima">America/Lima (UTC-5)</option>
          <option value="America/Santiago">America/Santiago (UTC-4)</option>
          <option value="Europe/Madrid">Europe/Madrid (UTC+1)</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Settings className="w-4 h-4" />
        )}
        {isLoading ? 'Guardando...' : 'Guardar Preferencias'}
      </button>
    </form>
  );
};

export default PreferencesForm;
