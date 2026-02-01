import React, { useState } from 'react';
import { useTheme } from '../js/ThemeContext';

const ThemeSwitcher = ({ className = '', showLabel = true }) => {
  const { currentTheme, availableThemes, switchTheme, isLoading } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleThemeChange = async (themeId) => {
    setIsOpen(false);
    await switchTheme(themeId);
  };

  const getCurrentThemeDisplay = () => {
    const theme = availableThemes.find(t => t.id === currentTheme);
    return theme ? theme.displayName : 'Default';
  };

  return (
    <div className={`theme-switcher ${className}`}>
      {showLabel && (
        <label htmlFor="theme-select" className="form-label me-2">
          Theme:
        </label>
      )}
      
      <div className="dropdown">
        <button
          className="btn btn-secondary dropdown-toggle"
          type="button"
          id="theme-dropdown"
          data-bs-toggle="dropdown"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Loading...
            </>
          ) : (
            getCurrentThemeDisplay()
          )}
        </button>
        
        <ul className={`dropdown-menu ${isOpen ? 'show' : ''}`} aria-labelledby="theme-dropdown">
          {availableThemes.map((theme) => (
            <li key={theme.id}>
              <button
                className={`dropdown-item ${currentTheme === theme.id ? 'active' : ''}`}
                type="button"
                onClick={() => handleThemeChange(theme.id)}
                disabled={isLoading}
              >
                {theme.displayName}
                {currentTheme === theme.id && (
                  <span className="ms-2">✓</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ThemeSwitcher;
