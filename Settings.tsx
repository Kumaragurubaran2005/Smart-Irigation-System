import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';

const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      
      <div className="bg-card rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Appearance</h2>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              {theme === 'dark' ? (
                <Moon className="text-primary" size={20} />
              ) : (
                <Sun className="text-primary" size={20} />
              )}
            </div>
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-muted-foreground">
                {theme === 'dark' ? 'Currently enabled' : 'Currently disabled'}
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={theme === 'dark'} 
              onChange={toggleTheme} 
              className="sr-only peer"
            />
            <div 
              className="w-11 h-6 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all bg-muted peer-checked:bg-primary"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default Settings;