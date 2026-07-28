import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { UserTable } from '../components/users/UserTable';
import { SearchInput } from '../components/users/SearchInput';
import { Pagination } from '../components/users/Pagination';
import { DeactivateConfirmModal } from '../components/users/DeactivateConfirmModal';
import type { UserOut } from '../types/auth';
import * as api from '../services/api';
import { Plus, Users, AlertCircle } from 'lucide-react';

export function UserListPage() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<UserOut[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deactivateTarget, setDeactivateTarget] = useState<UserOut | null>(null);

  const loadUsuarios = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await api.listUsuarios(search || undefined, page, 10);
      setUsuarios(result.items);
      setTotal(result.total);
      setTotalPages(result.total_pages);
    } catch {
      setError('Error al cargar usuarios');
      setUsuarios([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    loadUsuarios();
  }, [loadUsuarios]);

  // Debounce search
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimer) clearTimeout(searchTimer);
    const timer = setTimeout(() => {
      setPage(1);
    }, 400);
    setSearchTimer(timer);
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivateTarget) return;
    await loadUsuarios();
    setDeactivateTarget(null);
  };

  return (
    <AppLayout title="Usuarios">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Gestión de Usuarios</h2>
            <p className="text-sm text-slate-500 mt-1">
              {total > 0 ? `${total} usuario${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}` : 'Gestione los usuarios del sistema'}
            </p>
          </div>
          <button
            onClick={() => navigate('/usuarios/nuevo')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo usuario
          </button>
        </div>

        {/* Search */}
        <div className="max-w-sm">
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder="Buscar por nombre o email..."
          />
        </div>

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/4" />
                  </div>
                  <div className="h-6 bg-slate-200 rounded-full w-20" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Empty state */}
            {usuarios.length === 0 && !isLoading ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-1">No hay usuarios</h3>
                <p className="text-sm text-slate-500 mb-4">
                  {search ? 'No se encontraron usuarios con ese criterio de búsqueda' : 'Comience creando el primer usuario del sistema'}
                </p>
                {!search && (
                  <button
                    onClick={() => navigate('/usuarios/nuevo')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Crear usuario
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <UserTable
                  usuarios={usuarios}
                  onEdit={(user) => navigate(`/usuarios/${user.id}/editar`)}
                  onDeactivate={setDeactivateTarget}
                />
                <div className="p-4 border-t border-slate-100">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Deactivate modal */}
      {deactivateTarget && (
        <DeactivateConfirmModal
          userId={deactivateTarget.id}
          userName={deactivateTarget.nombre_completo || ''}
          onConfirm={handleDeactivateConfirm}
          onCancel={() => setDeactivateTarget(null)}
        />
      )}
    </AppLayout>
  );
}
