import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usuariosApi } from '../services/api';
import type { UserOut } from '../types/auth';
import UserTable from '../components/users/UserTable';
import SearchInput from '../components/users/SearchInput';
import Pagination from '../components/users/Pagination';
import DeactivateConfirmModal from '../components/users/DeactivateConfirmModal';
import AppLayout from '../components/layout/AppLayout';
import { Users, Plus, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export default function UserListPage() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<UserOut[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deactivateUser, setDeactivateUser] = useState<UserOut | null>(null);

  const fetchUsuarios = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await usuariosApi.list({
        search: search || undefined,
        page,
        page_size: 10,
      });
      setUsuarios(response.items);
      setTotal(response.total);
      setTotalPages(response.total_pages);
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
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  function handleSearchChange(value: string) {
    setSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => setPage(1), 400));
  }

  async function handleDeactivate(user: UserOut) {
    try {
      await usuariosApi.deactivate(user.id);
      setDeactivateUser(null);
      fetchUsuarios();
    } catch {
      // Error handled by modal
    }
  }

  async function handleReactivate(user: UserOut) {
    try {
      await usuariosApi.reactivate(user.id);
      fetchUsuarios();
    } catch {
      // Silently handle
    }
  }

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Usuarios</h1>
              <p className="text-sm text-slate-500">{total} usuario(s) registrado(s)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchUsuarios}
              className="flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </button>
            <button
              type="button"
              onClick={() => navigate('/usuarios/nuevo')}
              className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all"
            >
              <Plus className="h-4 w-4" />
              Nuevo usuario
            </button>
          </div>
        </div>

        {/* Search */}
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Buscar por nombre o email..."
        />

        {/* Error */}
        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          </div>
        ) : (
          <>
            {/* Table */}
            <UserTable
              usuarios={usuarios}
              onEdit={(user) => navigate(`/usuarios/${user.id}/editar`)}
              onDeactivate={(user) => setDeactivateUser(user)}
              onReactivate={handleReactivate}
            />

            {/* Pagination */}
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}

        {/* Deactivate Modal */}
        {deactivateUser && (
          <DeactivateConfirmModal
            userName={deactivateUser.nombre_completo}
            onConfirm={() => handleDeactivate(deactivateUser)}
            onCancel={() => setDeactivateUser(null)}
          />
        )}
      </div>
    </AppLayout>
  );
}
