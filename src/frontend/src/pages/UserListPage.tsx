import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, AlertCircle } from 'lucide-react';
import UserTable from '../components/users/UserTable';
import SearchInput from '../components/users/SearchInput';
import Pagination from '../components/users/Pagination';
import DeactivateConfirmModal from '../components/users/DeactivateConfirmModal';
import * as api from '../services/api';
import type { UserOut } from '../types/auth';

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
  const [reactivateTarget, setReactivateTarget] = useState<UserOut | null>(null);
  const [isReactivating, setIsReactivating] = useState(false);

  const fetchUsuarios = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await api.listUsuarios(search || undefined, page, 10);
      setUsuarios(result.items);
      setTotalPages(result.total_pages);
      setTotal(result.total);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al cargar usuarios';
      setError(message);
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
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  async function handleDeactivate() {
    if (!deactivateTarget) return;
    setIsDeactivating(true);
    try {
      await api.deactivateUsuario(deactivateTarget.id);
      setDeactivateTarget(null);
      fetchUsuarios();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al desactivar usuario';
      setError(message);
    } finally {
      setIsDeactivating(false);
    }
  }

  async function handleReactivate(user: UserOut) {
    setReactivateTarget(user);
    setIsReactivating(true);
    try {
      await api.reactivateUsuario(user.id);
      setReactivateTarget(null);
      fetchUsuarios();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al reactivar usuario';
      setError(message);
    } finally {
      setIsReactivating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Usuarios</h2>
          <p className="text-sm text-slate-500 mt-1">
            {total} usuario{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => navigate('/usuarios/nuevo')}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all"
        >
          <Plus className="w-5 h-5" />
          Nuevo Usuario
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Buscar por nombre o email..."
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <UserTable
              usuarios={usuarios}
              onEdit={(user) => navigate(`/usuarios/${user.id}/editar`)}
              onDeactivate={setDeactivateTarget}
              onReactivate={handleReactivate}
            />
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Reactivate loading state */}
      {reactivateTarget && isReactivating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-2xl p-6">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mx-auto" />
          </div>
        </div>
      )}

      {/* Deactivate modal */}
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
