import { Menu, Store } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  title?: string;
}

export default function Navbar({ onToggleSidebar, title }: NavbarProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4">
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-xl hover:bg-slate-100 transition-all text-slate-600"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex items-center gap-2">
        <Store className="h-5 w-5 text-slate-900" />
        <h1 className="text-lg font-semibold text-slate-900">
          {title || 'Ferretería'}
        </h1>
      </div>
    </header>
  );
}
