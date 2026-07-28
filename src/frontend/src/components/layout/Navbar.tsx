import { Menu, X } from 'lucide-react';

interface NavbarProps {
  sidebarOpen: boolean;
  onToggle: () => void;
  title: string;
}

export default function Navbar({ sidebarOpen, onToggle, title }: NavbarProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-2xl text-slate-600 hover:bg-slate-100 transition-all"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        </div>
      </div>
    </header>
  );
}
