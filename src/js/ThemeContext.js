import React, { createContext, useContext, useState, useEffect } from 'react';
import * as themeUtils from '../utils/themeUtils';
import { js_localStorage } from '../js/js_localStorage.js';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return js_localStorage.fn_getSelectedTheme();
  });
  const [isLoading, setIsLoading] = useState(false);

  const availableThemes = [
    { id: 'default', name: 'Default', displayName: 'Default Bootstrap' },
    { id: 'cerulean', name: 'Cerulean', displayName: 'Cerulean' },
    { id: 'cosmo', name: 'Cosmo', displayName: 'Cosmo' },
    { id: 'cyborg', name: 'Cyborg', displayName: 'Cyborg' },
    { id: 'darkly', name: 'Darkly', displayName: 'Darkly' },
    { id: 'flatly', name: 'Flatly', displayName: 'Flatly' },
    { id: 'journal', name: 'Journal', displayName: 'Journal' },
    { id: 'litera', name: 'Litera', displayName: 'Litera' },
    { id: 'lumen', name: 'Lumen', displayName: 'Lumen' },
    { id: 'lux', name: 'Lux', displayName: 'Lux' },
    { id: 'materia', name: 'Materia', displayName: 'Materia' },
    { id: 'minty', name: 'Minty', displayName: 'Minty' },
    { id: 'morph', name: 'Morph', displayName: 'Morph' },
    { id: 'pulse', name: 'Pulse', displayName: 'Pulse' },
    { id: 'quartz', name: 'Quartz', displayName: 'Quartz' },
    { id: 'sandstone', name: 'Sandstone', displayName: 'Sandstone' },
    { id: 'simplex', name: 'Simplex', displayName: 'Simplex' },
    { id: 'sketchy', name: 'Sketchy', displayName: 'Sketchy' },
    { id: 'slate', name: 'Slate', displayName: 'Slate' },
    { id: 'solar', name: 'Solar', displayName: 'Solar' },
    { id: 'spacelab', name: 'Spacelab', displayName: 'Spacelab' },
    { id: 'superhero', name: 'Superhero', displayName: 'Superhero' },
    { id: 'united', name: 'United', displayName: 'United' },
    { id: 'vapor', name: 'Vapor', displayName: 'Vapor' },
    { id: 'yeti', name: 'Yeti', displayName: 'Yeti' },
    { id: 'zephyr', name: 'Zephyr', displayName: 'Zephyr' }
  ];

  const switchTheme = async (themeId) => {
    if (themeId === currentTheme) return;
    
    setIsLoading(true);
    try {
      await themeUtils.switchTheme(themeId);
      setCurrentTheme(themeId);
      js_localStorage.fn_setSelectedTheme(themeId);
    } catch (error) {
      console.error('Failed to switch theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initialize theme on mount only
    const initializeTheme = async () => {
      if (currentTheme !== 'default') {
        try {
          await themeUtils.switchTheme(currentTheme);
        } catch (error) {
          console.warn('Failed to initialize theme:', error);
        }
      }
    };
    
    initializeTheme();
  }, []); // Only run on mount

  const value = {
    currentTheme,
    availableThemes,
    switchTheme,
    isLoading
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
