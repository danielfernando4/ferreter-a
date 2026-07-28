import { Menu } from 'lucide-react';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors mr-3"
      >
        <Menu className="w-5 h-5 text-slate-600" />
      </button>
      <h2 className="text-lg font-semibold text-slate-900 lg:hidden">Ferretería</h2>
    </header>
  );
}
