import { Menu } from 'lucide-react';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-slate-200">
      <div className="flex items-center justify-between px-4 sm:px-6 h-16">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <Menu className="h-5 w-5 text-slate-600" />
        </button>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">Ferretería</span>
        </div>
      </div>
    </header>
  );
}
