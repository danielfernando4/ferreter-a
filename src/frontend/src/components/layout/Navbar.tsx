import { Menu } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 sticky top-0 z-20">
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-all lg:hidden"
      >
        <Menu size={22} />
      </button>
      <div className="ml-auto flex items-center gap-4">
        <span className="text-sm text-slate-500">Ferretería</span>
      </div>
    </header>
  );
}
