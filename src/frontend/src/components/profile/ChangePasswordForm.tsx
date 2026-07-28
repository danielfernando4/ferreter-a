import React, { useState } from 'react';
import { Loader2, Lock, Eye, EyeOff, Save } from 'lucide-react';

interface ChangePasswordFormProps {
  onSubmit: (data: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }) => Promise<void>;
}

export default function ChangePasswordForm({ onSubmit }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setError('La contraseña actual es obligatoria');
      return;
    }
    if (!newPassword) {
      setError('La nueva contraseña es obligatoria');
      return;
    }
    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      await onSubmit({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setSuccess('Contraseña actualizada exitosamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.detail || 'Error al cambiar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-amber-100 rounded-xl">
          <Lock className="text-amber-600" size={24} />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Cambiar contraseña</h3>
      </div>

      <div className="relative">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Contraseña actual
        </label>
        <input
          type={showPasswords ? 'text' : 'password'}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900 pr-10"
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={() => setShowPasswords(!showPasswords)}
          className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600"
        >
          {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Nueva contraseña
        </label>
        <input
          type={showPasswords ? 'text' : 'password'}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900"
          placeholder="Mínimo 6 caracteres"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Confirmar nueva contraseña
        </label>
        <input
          type={showPasswords ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900"
          placeholder="Repite la contraseña"
          disabled={isLoading}
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 text-sm px-4 py-2 rounded-xl border border-green-200">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-50 transition-all font-medium"
      >
        {isLoading ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <Save size={18} />
        )}
        {isLoading ? 'Guardando...' : 'Cambiar contraseña'}
      </button>
    </form>
  );
}
