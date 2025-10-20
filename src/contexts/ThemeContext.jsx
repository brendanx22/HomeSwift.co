import React, { createContext, useContext, useState, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

// Theme Context
const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {}
});

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  });

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;

    // Remove existing theme classes
    root.classList.remove('light', 'dark', 'system');

    // Add new theme class
    root.classList.add(theme);

    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Listen for system theme changes when theme is 'system'
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const handleChange = (e) => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme Toggle Component
export const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-5 h-5" />;
      case 'dark':
        return <Moon className="w-5 h-5" />;
      case 'system':
        return <Monitor className="w-5 h-5" />;
      default:
        return <Sun className="w-5 h-5" />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return 'Light';
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800 ${className}`}
      title={`Current theme: ${getLabel()}. Click to change.`}
    >
      {getIcon()}
      <span className="text-sm hidden sm:inline">{getLabel()}</span>
    </button>
  );
};

// Theme Selector Dropdown Component
export const ThemeSelector = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor }
  ];

  const currentTheme = themes.find(t => t.value === theme);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800"
      >
        {currentTheme && <currentTheme.icon className="w-5 h-5" />}
        <span className="text-sm hidden sm:inline">{currentTheme?.label}</span>
      </button>

      {isOpen && (
        <>
          <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
            {themes.map((themeOption) => (
              <button
                key={themeOption.value}
                onClick={() => {
                  setTheme(themeOption.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  theme === themeOption.value
                    ? 'bg-[#FF6B35] text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <themeOption.icon className="w-4 h-4" />
                <span>{themeOption.label}</span>
              </button>
            ))}
          </div>

          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        </>
      )}
    </div>
  );
};
