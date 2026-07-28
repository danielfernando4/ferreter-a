import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../services/api';
import type { UserOut } from '../../types/auth';
import UserTable from '../components/users/UserTable';
import SearchInput from '../components/users/SearchInput';
import Pagination from '../components/users/Pagination';
import DeactivateConfirmModal from '../components/users/DeactivateConfirmModal';
import { Plus, Users, AlertCircle } from 'lucide-react';

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

  const fetchUsuarios = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.listUsuarios({ search: search || undefined, page, page_size: 10 });
      setUsuarios(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch {
      setError('Error al cargar los usuarios');
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await api.deactivateUsuario(deactivateTarget.id);
      setDeactivateTarget(null);
      fetchUsuarios();
    } catch {
      setError('Error al desactivar el usuario');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
          <p className="text-sm text-slate-500 mt-1">
            {total > 0 ? `${total} usuario${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}` : 'Gestiona los usuarios del sistema'}
          </p>
        </div>
        <button
          onClick={() => navigate('/usuarios/nuevo')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all"
        >
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </button>
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Buscar usuarios..."
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : usuarios.length === 0 ? (
        /* Empty */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No hay usuarios</h3>
          <p className="text-sm text-slate-500 mb-4">
            {search ? 'No se encontraron usuarios con ese criterio de búsqueda.' : 'Comienza creando el primer usuario del sistema.'}
          </p>
          {!search && (
            <button
              onClick={() => navigate('/usuarios/nuevo')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all"
            >
              <Plus className="h-4 w-4" />
              Crear usuario
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <UserTable
              usuarios={usuarios}
              onEdit={(user) => navigate(`/usuarios/${user.id}/editar`)}
              onDeactivate={setDeactivateTarget}
            />
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Deactivate Modal */}
      {deactivateTarget && (
        <DeactivateConfirmModal
          userName={deactivateTarget.nombre_completo}
          onConfirm={handleDeactivate}
          onCancel={() => setDeactivateTarget(null)}
        />
      )}
    </div>
  );
}
