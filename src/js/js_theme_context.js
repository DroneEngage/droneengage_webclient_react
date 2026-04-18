import React, { createContext, useContext, useState, useEffect } from 'react';
import * as themeUtils from '../js/js_theme_utils';
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
    { id: 'superhero', name: 'Superhero', displayName: 'Superhero - Dark' },
    { id: 'vapor', name: 'Vapor', displayName: 'Vapor - Dark' },
    { id: 'zephyr', name: 'Zephyr', displayName: 'Zephyr - Light' },
    { id: 'darkly', name: 'Darkly', displayName: 'Darkly - Dark' },
    { id: 'slate', name: 'Slate', displayName: 'Slate - Dark' },
    { id: 'solar', name: 'Solar', displayName: 'Solar - Dark' },
    { id: 'cerulean', name: 'Cerulean', displayName: 'Cerulean - Light' },
    { id: 'cosmo', name: 'Cosmo', displayName: 'Cosmo - Light' },
    { id: 'litera', name: 'Litera', displayName: 'Litera - Light' },
    { id: 'lumen', name: 'Lumen', displayName: 'Lumen - Light' },
    { id: 'minty', name: 'Minty', displayName: 'Minty - Light' },
    { id: 'morph', name: 'Morph', displayName: 'Morph - Light' },
    { id: 'pulse', name: 'Pulse', displayName: 'Pulse - Light' },
    { id: 'sandstone', name: 'Sandstone', displayName: 'Sandstone - Light' },
    { id: 'simplex', name: 'Simplex', displayName: 'Simplex - Light' },
    { id: 'sketchy', name: 'Sketchy', displayName: 'Sketchy - Light' },
    { id: 'spacelab', name: 'Spacelab', displayName: 'Spacelab - Light' },
    { id: 'united', name: 'United', displayName: 'United - Light' },
    { id: 'yeti', name: 'Yeti', displayName: 'Yeti - Light' }
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
