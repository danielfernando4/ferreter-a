import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex">
        <Sidebar open={sidebarOpen} />
        <main
          className={`flex-1 transition-all duration-300 p-6 ${
            sidebarOpen ? 'md:ml-64' : 'md:ml-16'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
