import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = ({ variant = 'button' }) => {
  const { 
    mode, 
    userPreference, 
    systemPreference, 
    toggleTheme, 
    setUserPreference,
    isDark,
    isLight
  } = useTheme();

  if (variant === 'dropdown') {
    return (
      <div className="relative">
        <select
          value={userPreference || 'system'}
          onChange={(e) => {
            const value = e.target.value;
            setUserPreference(value === 'system' ? null : value);
          }}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-white/20 dark:bg-gray-800/20 text-white dark:text-gray-200 appearance-none pr-8 backdrop-blur-sm border border-white/30 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-gray-500 transition-colors h-[40px]"
          style={{ minWidth: 120 }}
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
        <div className="absolute right-2 top-2.5 pointer-events-none">
          {mode === 'light' ? (
            <Sun className="h-4 w-4 text-white dark:text-gray-200" />
          ) : (
            <Moon className="h-4 w-4 text-white dark:text-gray-200" />
          )}
        </div>
      </div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className="relative p-2 rounded-lg bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all duration-200 border border-white/30 dark:border-gray-600 group"
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-5 h-5">
        {/* Icône du soleil */}
        <motion.div
          initial={false}
          animate={{
            scale: isLight ? 1 : 0,
            rotate: isLight ? 0 : 180,
            opacity: isLight ? 1 : 0
          }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Sun className="h-5 w-5 text-white dark:text-gray-200" />
        </motion.div>
        
        {/* Icône de la lune */}
        <motion.div
          initial={false}
          animate={{
            scale: isDark ? 1 : 0,
            rotate: isDark ? 0 : -180,
            opacity: isDark ? 1 : 0
          }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Moon className="h-5 w-5 text-white dark:text-gray-200" />
        </motion.div>
      </div>
      
      {/* Indicateur de préférence système */}
      {!userPreference && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      )}
    </motion.button>
  );
};

// Composant d'information sur le thème
export const ThemeInfo = () => {
  const { mode, userPreference, systemPreference } = useTheme();
  
  return (
    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
      <div>Current: {mode}</div>
      <div>System: {systemPreference}</div>
      <div>User: {userPreference || 'auto'}</div>
    </div>
  );
};

export default ThemeToggle;