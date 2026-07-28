import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2 } from 'lucide-react';
import { listUsuarios, deactivateUsuario } from '../services/api';
import type { UserOut } from '../types/auth';
import UserTable from '../components/users/UserTable';
import SearchInput from '../components/users/SearchInput';
import Pagination from '../components/users/Pagination';
import DeactivateConfirmModal from '../components/users/DeactivateConfirmModal';

export default function UserListPage() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<UserOut[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deactivateTarget, setDeactivateTarget] = useState<UserOut | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const fetchUsuarios = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await listUsuarios({ search: search || undefined, page, page_size: 10 });
      setUsuarios(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar usuarios';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchUsuarios();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setIsDeactivating(true);
    try {
      await deactivateUsuario(deactivateTarget.id);
      setDeactivateTarget(null);
      fetchUsuarios();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al desactivar usuario';
      setError(msg);
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
          <p className="text-sm text-slate-500 mt-1">
            {total > 0 ? `${total} usuarios registrados` : 'Gestión de usuarios del sistema'}
          </p>
        </div>
        <button
          onClick={() => navigate('/usuarios/nuevo')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-all shadow-sm"
        >
          <Plus size={18} />
          Nuevo usuario
        </button>
      </div>

      <div className="max-w-sm">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre o email..."
        />
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-slate-400" />
          </div>
        ) : (
          <UserTable
            usuarios={usuarios}
            onEdit={user => navigate(`/usuarios/${user.id}/editar`)}
            onDeactivate={setDeactivateTarget}
          />
        )}
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {deactivateTarget && (
        <DeactivateConfirmModal
          userName={deactivateTarget.nombre_completo}
          onConfirm={handleDeactivate}
          onCancel={() => setDeactivateTarget(null)}
          isLoading={isDeactivating}
        />
      )}
    </div>
  );
}
