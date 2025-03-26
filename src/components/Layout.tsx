import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, Info, Settings as SettingsIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const Layout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: <Home size={24} />, label: 'Home' },
    { path: '/schedule', icon: <Calendar size={24} />, label: 'Schedule' },
    { path: '/about', icon: <Info size={24} />, label: 'About Us' },
    { path: '/settings', icon: <SettingsIcon size={24} />, label: 'Settings' }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background max-w-screen overflow-x-hidden">
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-card text-card-foreground px-4 py-3 md:p-4 shadow-md w-full"
      >
        <div className="container mx-auto flex justify-between items-center max-w-7xl px-2 md:px-4">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-xl md:text-2xl font-bold text-primary"
          >
            ROCK
          </motion.h1>
          <div className="flex items-center gap-2"></div>
        </div>
      </motion.header>

      <main className="flex-1 container mx-auto px-3 py-4 md:p-6 pb-24 max-w-7xl">
        <Outlet />
      </main>

      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-card shadow-[0_-2px_10px_rgba(0,0,0,0.1)] text-card-foreground fixed bottom-0 left-0 right-0 z-50 w-full"
      >
        <div className="container mx-auto flex justify-between max-w-7xl px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex flex-col items-center py-2 md:py-3 px-2 md:px-4 flex-1 transition-all duration-200 ${
                  isActive 
                    ? 'text-primary scale-105' 
                    : 'text-muted-foreground hover:text-foreground hover:scale-105'
                }`
              }
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="w-5 h-5 md:w-6 md:h-6"
              >
                {item.icon}
              </motion.div>
              <span className="text-[10px] md:text-xs mt-1">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </motion.nav>
    </div>
  );
};

export default Layout;