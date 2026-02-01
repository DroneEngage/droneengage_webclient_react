// Base path where all Bootswatch theme CSS files are located
const THEME_BASE_PATH = '/css/themes';
// Path to the default Bootstrap CSS file (used when no theme is selected)
const DEFAULT_BOOTSTRAP_CSS = '/css/bootstrap.min.css';
// ID attribute for the <link> element that loads the theme CSS
const THEME_CSS_ID = 'theme-bootstrap-css';

/**
 * Applies a theme-specific class to the document body.
 * This allows CSS rules to target specific themes for custom overrides.
 * @param {string} themeId - The theme identifier (e.g., 'cyborg', 'darkly')
 */
const applyThemeClass = (themeId) => {
  // Safety check: ensure we're in a browser environment with DOM access
  if (!document || !document.body) return;

  // Collect all existing theme classes from the body element
  const classesToRemove = [];
  for (const className of document.body.classList) {
    if (className.startsWith('theme-')) {
      classesToRemove.push(className);
    }
  }

  // Remove all existing theme classes to prevent conflicts
  if (classesToRemove.length > 0) {
    document.body.classList.remove(...classesToRemove);
  }

  // Add the new theme class (e.g., 'theme-cyborg')
  document.body.classList.add(`theme-${themeId}`);
};

/**
 * Load a CSS file dynamically
 * @param {string} href - Path to CSS file
 * @param {string} id - Element ID for the link tag
 * @returns {Promise} - Resolves when CSS is loaded
 */
const loadCSS = (href, id) => {
  return new Promise((resolve, reject) => {
    // Remove any existing theme CSS with the same ID to prevent conflicts
    const existingLink = document.getElementById(id);
    if (existingLink) {
      existingLink.remove();
    }

    // Create a new <link> element for the CSS file
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = href;
    link.id = id;

    // Resolve the promise when CSS loads successfully
    link.onload = () => resolve(link);
    // Reject the promise if CSS fails to load
    link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));

    // Add the link element to the document's head section
    document.head.appendChild(link);
  });
};

/**
 * Remove a CSS file by ID
 * @param {string} id - Element ID of the link tag
 */
const removeCSS = (id) => {
  // Find the <link> element with the specified ID
  const link = document.getElementById(id);
  // Remove it from the DOM if it exists
  if (link) {
    link.remove();
  }
};

// Helper function to clean up any existing theme CSS
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
      // Load the default Bootstrap CSS file
      await loadCSS(DEFAULT_BOOTSTRAP_CSS, THEME_CSS_ID);
    } else {
      // Construct the path to the themed Bootstrap CSS file
      const themeCSSPath = `${THEME_BASE_PATH}/${themeId}/bootstrap.min.css`;
      // Load the themed CSS file
      await loadCSS(themeCSSPath, THEME_CSS_ID);
    }

    // Apply the corresponding theme class to the body
    applyThemeClass(themeId);
  } catch (error) {
    console.error('Theme switching error:', error);
    // Fallback: load default theme if the requested theme fails
    await loadCSS(DEFAULT_BOOTSTRAP_CSS, THEME_CSS_ID);
    applyThemeClass('default');
    // Re-throw the error so the caller knows something went wrong
    throw error;
  }
};

/**
 * Get the current active theme
 * @returns {string} - Current theme ID
 */
export const getCurrentTheme = () => {
  // Find the theme CSS link element in the DOM
  const themeLink = document.getElementById(THEME_CSS_ID);
  // If no theme CSS is loaded, assume default theme
  if (!themeLink) return 'default';

  // Get the href attribute of the link element
  const href = themeLink.href;
  // Check if it's the default Bootstrap CSS
  if (href.includes(DEFAULT_BOOTSTRAP_CSS)) {
    return 'default';
  }
  
  // Extract theme name from the path (e.g., '/css/themes/cyborg/bootstrap.min.css' -> 'cyborg')
  const match = href.match(/themes\/([^/]+)\//);
  return match ? match[1] : 'default';
};

/**
 * Check if a theme is available in the system
 * @param {string} themeId - Theme identifier
 * @returns {boolean} - True if theme exists
 */
export const isThemeAvailable = (themeId) => {
  // Default theme is always available
  if (themeId === 'default') return true;
  
  // Hardcoded list of available Bootswatch themes
  // In a production app, you might want to verify the file actually exists
  const availableThemes = [
    'cerulean', 'cosmo', 'cyborg', 'darkly', 'flatly', 'journal', 
    'litera', 'lumen', 'lux', 'materia', 'minty', 'morph', 'pulse', 
    'quartz', 'sandstone', 'simplex', 'sketchy', 'slate', 'solar', 
    'spacelab', 'superhero', 'united', 'vapor', 'yeti', 'zephyr'
  ];
  
  // Check if the requested theme is in our available themes list
  return availableThemes.includes(themeId);
};

/**
 * Initialize theme system on app start
 * @param {string} preferredTheme - Theme to load on startup
 */
export const initializeTheme = async (preferredTheme = 'default') => {
  // Only try to load a non-default theme if it's available
  if (preferredTheme !== 'default' && isThemeAvailable(preferredTheme)) {
    try {
      // Attempt to load the preferred theme
      await switchTheme(preferredTheme);
    } catch (error) {
      // If loading fails, fall back to default theme and log warning
      console.warn('Failed to load preferred theme, using default:', error);
      await switchTheme('default');
    }
  }
};
