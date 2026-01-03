import React from 'react';
import Navbar from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, fullWidth = false }) => {
  return (
    <div className={`bg-[#F8FAFC] flex flex-col ${fullWidth ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <Navbar />
      <main className={fullWidth ? 'flex-1 overflow-hidden flex flex-col relative' : 'container mx-auto px-4 py-8'}>
        {children}
      </main>
    </div>
  );
};

export default Layout;