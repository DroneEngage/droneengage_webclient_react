const THEME_BASE_PATH = '/css/themes';
const DEFAULT_BOOTSTRAP_CSS = '/css/bootstrap.min.css';
const THEME_CSS_ID = 'theme-bootstrap-css';

/**
 * Load a CSS file dynamically
 * @param {string} href - Path to CSS file
 * @param {string} id - Element ID for the link tag
 * @returns {Promise} - Resolves when CSS is loaded
 */
const loadCSS = (href, id) => {
  return new Promise((resolve, reject) => {
    // Remove existing theme CSS if present
    const existingLink = document.getElementById(id);
    if (existingLink) {
      existingLink.remove();
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = href;
    link.id = id;

    link.onload = () => resolve(link);
    link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));

    document.head.appendChild(link);
  });
};

/**
 * Remove a CSS file by ID
 * @param {string} id - Element ID of the link tag
 */
const removeCSS = (id) => {
  const link = document.getElementById(id);
  if (link) {
    link.remove();
  }
};

// Helper function to remove existing theme CSS
const cleanupThemeCSS = () => {
  removeCSS(THEME_CSS_ID);
};

/**
 * Switch to a specific theme
 * @param {string} themeId - Theme identifier
 * @returns {Promise} - Resolves when theme is switched
 */
export const switchTheme = async (themeId) => {
  try {
    if (themeId === 'default') {
      // Load default Bootstrap CSS
      await loadCSS(DEFAULT_BOOTSTRAP_CSS, THEME_CSS_ID);
    } else {
      // Load themed Bootstrap CSS
      const themeCSSPath = `${THEME_BASE_PATH}/${themeId}/bootstrap.min.css`;
      await loadCSS(themeCSSPath, THEME_CSS_ID);
    }
  } catch (error) {
    console.error('Theme switching error:', error);
    // Fallback to default theme
    await loadCSS(DEFAULT_BOOTSTRAP_CSS, THEME_CSS_ID);
    throw error;
  }
};

/**
 * Get the current active theme
 * @returns {string} - Current theme ID
 */
export const getCurrentTheme = () => {
  const themeLink = document.getElementById(THEME_CSS_ID);
  if (!themeLink) return 'default';

  const href = themeLink.href;
  if (href.includes(DEFAULT_BOOTSTRAP_CSS)) {
    return 'default';
  }
  
  // Extract theme name from path
  const match = href.match(/themes\/([^/]+)\//);
  return match ? match[1] : 'default';
};

/**
 * Check if a theme is available
 * @param {string} themeId - Theme identifier
 * @returns {boolean} - True if theme exists
 */
export const isThemeAvailable = (themeId) => {
  if (themeId === 'default') return true;
  
  // This is a basic check - in a real app you might want to verify the file exists
  const availableThemes = [
    'cerulean', 'cosmo', 'cyborg', 'darkly', 'flatly', 'journal', 
    'litera', 'lumen', 'lux', 'materia', 'minty', 'morph', 'pulse', 
    'quartz', 'sandstone', 'simplex', 'sketchy', 'slate', 'solar', 
    'spacelab', 'superhero', 'united', 'vapor', 'yeti', 'zephyr'
  ];
  
  return availableThemes.includes(themeId);
};

/**
 * Initialize theme system on app start
 * @param {string} preferredTheme - Theme to load on startup
 */
export const initializeTheme = async (preferredTheme = 'default') => {
  if (preferredTheme !== 'default' && isThemeAvailable(preferredTheme)) {
    try {
      await switchTheme(preferredTheme);
    } catch (error) {
      console.warn('Failed to load preferred theme, using default:', error);
      await switchTheme('default');
    }
  }
};
