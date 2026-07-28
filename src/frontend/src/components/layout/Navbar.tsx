import { Menu, X } from 'lucide-react';

interface NavbarProps {
  onMenuToggle: () => void;
  sidebarOpen: boolean;
}

export function Navbar({ onMenuToggle, sidebarOpen }: NavbarProps) {
  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm h-16 flex items-center px-4 lg:px-6 sticky top-0 z-30">
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-2xl hover:bg-slate-100 transition-all mr-3"
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-sm">F</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900">Ferretería</h1>
      </div>
    </nav>
  );
}
