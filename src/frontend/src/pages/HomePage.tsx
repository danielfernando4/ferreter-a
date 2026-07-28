import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';

export function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/usuarios', { replace: true });
  }, [navigate]);

  return (
    <AppLayout title="Dashboard">
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    </AppLayout>
  );
}
