import React from 'react';

import { useTheme } from '../js/js_theme_context';
import { js_localStorage } from '../js/js_localStorage';

export class ClssThemeSwitcher extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            is_open: false,
            m_update: 0
        };

        this.m_flag_mounted = false;
        this.key = Math.random().toString();
        this.dropdownRef = React.createRef();
    }

    componentDidMount() {
        this.m_flag_mounted = true;
        document.addEventListener('click', this.handleDocumentClick);
    }

    componentWillUnmount() {
        this.m_flag_mounted = false;
        document.removeEventListener('click', this.handleDocumentClick);
    }

    handleDocumentClick = (event) => {
        if (this.dropdownRef.current && !this.dropdownRef.current.contains(event.target)) {
            this.setState({ is_open: false });
        }
    }

    fn_toggle_dropdown = () => {
        if (this.m_flag_mounted === false) return;
        this.setState({ is_open: !this.state.is_open });
    }

    fn_handle_theme_change = async (themeId) => {
        if (this.m_flag_mounted === false) return;
        
        this.setState({ is_open: false });
        const { switchTheme } = this.props;
        await switchTheme(themeId);
    }

    fn_get_current_theme_display = () => {
        const { currentTheme, availableThemes } = this.props;
        const theme = availableThemes.find(t => t.id === currentTheme);
        return theme ? theme.displayName : 'Default';
    }

    render() {
        const { className = '', showLabel = true, currentTheme, availableThemes, isLoading } = this.props;
        const dir = 'al_l'; // Default LTR direction
        
        let control = [];
        
        control.push(
            <div key={'ClssThemeSwitcher_complex' + this.key} className={`theme-switcher ${className}`} ref={this.dropdownRef}>
                {showLabel && (
                    <label key={'theme-label' + this.key} htmlFor="theme-select" className={`form-label me-2 txt-theme-aware ${dir}`}>
                        Theme:
                    </label>
                )}
                
                <div className="dropdown">
                    <button
                        key={'theme-dropdown-btn' + this.key}
                        className={'btn btn-secondary dropdown-toggle btn-sm mt-1 ' + (isLoading ? 'disabled' : '')}
                        type="button"
                        id="theme-dropdown"
                        data-bs-toggle="dropdown"
                        aria-expanded={this.state.is_open}
                        onClick={this.fn_toggle_dropdown}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Loading...
                            </>
                        ) : (
                            this.fn_get_current_theme_display()
                        )}
                    </button>
                    
                    <div className={`dropdown-menu ${this.state.is_open ? 'show' : ''}`} aria-labelledby="theme-dropdown">
                        {availableThemes.map((theme) => (
                            <button
                                key={theme.id}
                                className={`dropdown-item ${currentTheme === theme.id ? 'active' : ''}`}
                                type="button"
                                onClick={() => this.fn_handle_theme_change(theme.id)}
                                disabled={isLoading}
                            >
                                {theme.displayName}
                                {currentTheme === theme.id && (
                                    <span className="ms-2">✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );

        return control;
    }
}

// Functional wrapper component to use hooks
const ThemeSwitcher = (props) => {
    const themeContext = useTheme();
    return <ClssThemeSwitcher {...props} {...themeContext} />;
};

export default ThemeSwitcher;
