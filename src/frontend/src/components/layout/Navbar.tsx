import { Menu, X } from 'lucide-react';

interface NavbarProps {
  sidebarOpen: boolean;
  onToggle: () => void;
}

export default function Navbar({ sidebarOpen, onToggle }: NavbarProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 sticky top-0 z-30">
      <button
        onClick={onToggle}
        className="p-2 rounded-xl hover:bg-slate-100 transition-all lg:hidden"
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
      <div className="flex-1" />
      <div className="text-sm text-slate-500">Ferretería</div>
    </header>
  );
}
