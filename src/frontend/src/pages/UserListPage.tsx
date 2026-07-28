import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import { UserTable } from '../components/users/UserTable';
import { SearchInput } from '../components/users/SearchInput';
import { Pagination } from '../components/users/Pagination';
import { DeactivateConfirmModal } from '../components/users/DeactivateConfirmModal';
import { ErrorState } from '../components/ErrorState';
import { TableSkeleton } from '../components/Skeleton';
import { listUsuarios, reactivateUsuario } from '../services/api';
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
  const [deactivateTarget, setDeactivateTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const fetchUsuarios = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await listUsuarios(search || undefined, page, 10);
      setUsuarios(response.items);
      setTotal(response.total);
      setTotalPages(response.total_pages);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Error al cargar usuarios');
      } else {
        setError('Error al cargar usuarios');
      }
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleEdit = (id: number) => {
    navigate(`/usuarios/${id}/editar`);
  };

  const handleDeactivateClick = (id: number, name: string) => {
    setDeactivateTarget({ id, name });
  };

  const handleReactivate = async (id: number) => {
    try {
      await reactivateUsuario(id);
      fetchUsuarios();
    } catch {
      // Error handled silently
    }
  };

  const handleDeactivateConfirm = () => {
    setDeactivateTarget(null);
    fetchUsuarios();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestiona los usuarios del sistema
          </p>
        </div>
        <button
          onClick={() => navigate('/usuarios/nuevo')}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-2xl shadow-sm hover:bg-blue-700 transition-all text-sm font-medium"
        >
          <Plus size={18} />
          Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="w-full sm:w-72">
              <SearchInput
                value={search}
                onChange={handleSearchChange}
                placeholder="Buscar por nombre o email..."
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Users size={16} />
              {total} usuario{total !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="p-4">
          {isLoading ? (
            <TableSkeleton rows={5} cols={5} />
          ) : error ? (
            <ErrorState
              title="Error al cargar usuarios"
              message={error}
              onRetry={fetchUsuarios}
            />
          ) : (
            <UserTable
              usuarios={usuarios}
              onEdit={handleEdit}
              onDeactivate={handleDeactivateClick}
              onReactivate={handleReactivate}
            />
          )}
        </div>

        {!isLoading && !error && (
          <div className="px-4 pb-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {deactivateTarget && (
        <DeactivateConfirmModal
          userId={deactivateTarget.id}
          userName={deactivateTarget.name}
          onConfirm={handleDeactivateConfirm}
          onCancel={() => setDeactivateTarget(null)}
        />
      )}
    </div>
  );
}
