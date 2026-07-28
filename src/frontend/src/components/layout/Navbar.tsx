import { Menu } from 'lucide-react';

interface NavbarProps {
  onMenuClick: () => void;
  title?: string;
}

export function Navbar({ onMenuClick, title }: NavbarProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6 sticky top-0 z-30">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 lg:hidden mr-3"
      >
        <Menu className="w-5 h-5" />
      </button>
      {title && (
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      )}
    </header>
  );
}
