import React from 'react';
import { useApp } from '../context/AppContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useApp();

  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative flex items-center p-1.5 rounded-full border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer ${
        isDark
          ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-750'
          : 'bg-[#EFECE6] border-stone-300 text-amber-600 hover:bg-[#E7E3DC]'
      }`}
      title={isDark ? 'Switch to Light Mode (White Sand)' : 'Switch to Dark Mode'}
      aria-label="Toggle Theme"
    >
      <div className="flex items-center gap-1.5 px-1 pointer-events-none">
        <Sun
          className={`w-4 h-4 transition-transform duration-300 ${
            isDark ? 'text-slate-500 scale-90' : 'text-amber-600 scale-100'
          }`}
        />
        <Moon
          className={`w-4 h-4 transition-transform duration-300 ${
            isDark ? 'text-amber-400 scale-100' : 'text-stone-400 scale-90'
          }`}
        />
      </div>

      <span
        className={`absolute top-1 left-1 w-5 h-5 rounded-full shadow-md transition-transform duration-300 flex items-center justify-center pointer-events-none ${
          isDark
            ? 'translate-x-6 bg-slate-900 border border-slate-700 text-amber-400'
            : 'translate-x-0 bg-white border border-stone-200 text-amber-600'
        }`}
      >
        {isDark ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
      </span>
    </button>
  );
};
