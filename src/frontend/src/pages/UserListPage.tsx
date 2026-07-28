import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2 } from 'lucide-react';
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

  const fetchUsuarios = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.listUsuarios(search || undefined, page, 10);
      setUsuarios(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch {
      setError('Error al cargar usuarios.');
      setUsuarios([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const handleSearchChange = (value: string) => {
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
      setError('Error al desactivar usuario.');
    }
  };

  const handleReactivate = async (user: UserOut) => {
    try {
      await api.reactivateUsuario(user.id);
      fetchUsuarios();
    } catch {
      setError('Error al reactivar usuario.');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
          <p className="text-sm text-slate-500 mt-1">
            {total > 0 ? `${total} usuario${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}` : 'Gestiona los usuarios del sistema'}
          </p>
        </div>
        <button
          onClick={() => navigate('/usuarios/nuevo')}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all"
        >
          <Plus size={18} />
          Nuevo usuario
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder="Buscar por nombre o email..."
          />
        </div>

        {error && (
          <div className="p-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            <UserTable
              usuarios={usuarios}
              onEdit={(user) => navigate(`/usuarios/${user.id}/editar`)}
              onDeactivate={setDeactivateTarget}
              onReactivate={handleReactivate}
            />
            <div className="p-4 border-t border-slate-100">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>

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
