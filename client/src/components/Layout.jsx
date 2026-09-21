import React from 'react';
import Navbar from './Navbar';

/**
 * Common Layout component that wraps pages with Navbar and structured container
 */
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        AI Interview Coach &bull; Full-Stack Portfolio Application
      </footer>
    </div>
  );
};

export default Layout;
