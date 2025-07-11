import React, { createContext, useContext, useReducer, useEffect } from 'react';

// État initial du thème
const initialThemeState = {
  mode: 'light', // 'light' ou 'dark'
  systemPreference: 'light',
  userPreference: null, // null = suivre le système, 'light' ou 'dark' = préférence utilisateur
  transitions: true, // animations de transition
  reducedMotion: false // pour l'accessibilité
};

// Types d'actions
const ThemeActionTypes = {
  SET_THEME: 'SET_THEME',
  SET_SYSTEM_PREFERENCE: 'SET_SYSTEM_PREFERENCE',
  SET_USER_PREFERENCE: 'SET_USER_PREFERENCE',
  TOGGLE_THEME: 'TOGGLE_THEME',
  SET_TRANSITIONS: 'SET_TRANSITIONS',
  SET_REDUCED_MOTION: 'SET_REDUCED_MOTION'
};

// Reducer pour gérer l'état du thème
const themeReducer = (state, action) => {
  switch (action.type) {
    case ThemeActionTypes.SET_THEME:
      return {
        ...state,
        mode: action.payload
      };
    
    case ThemeActionTypes.SET_SYSTEM_PREFERENCE:
      return {
        ...state,
        systemPreference: action.payload,
        mode: state.userPreference || action.payload
      };
    
    case ThemeActionTypes.SET_USER_PREFERENCE:
      return {
        ...state,
        userPreference: action.payload,
        mode: action.payload || state.systemPreference
      };
    
    case ThemeActionTypes.TOGGLE_THEME:
      const newMode = state.mode === 'light' ? 'dark' : 'light';
      return {
        ...state,
        userPreference: newMode,
        mode: newMode
      };
    
    case ThemeActionTypes.SET_TRANSITIONS:
      return {
        ...state,
        transitions: action.payload
      };
    
    case ThemeActionTypes.SET_REDUCED_MOTION:
      return {
        ...state,
        reducedMotion: action.payload
      };
    
    default:
      return state;
  }
};

// Contexte du thème
const ThemeContext = createContext();

// Hook pour utiliser le contexte du thème
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Provider du thème
export const ThemeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, initialThemeState);

  // Détecter la préférence système
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e) => {
      dispatch({
        type: ThemeActionTypes.SET_SYSTEM_PREFERENCE,
        payload: e.matches ? 'dark' : 'light'
      });
    };

    // Définir la préférence système initiale
    dispatch({
      type: ThemeActionTypes.SET_SYSTEM_PREFERENCE,
      payload: mediaQuery.matches ? 'dark' : 'light'
    });

    // Écouter les changements de préférence système
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  // Détecter la préférence de mouvement réduit
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleReducedMotionChange = (e) => {
      dispatch({
        type: ThemeActionTypes.SET_REDUCED_MOTION,
        payload: e.matches
      });
    };

    dispatch({
      type: ThemeActionTypes.SET_REDUCED_MOTION,
      payload: mediaQuery.matches
    });

    mediaQuery.addEventListener('change', handleReducedMotionChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleReducedMotionChange);
    };
  }, []);

  // Charger la préférence utilisateur depuis localStorage
  useEffect(() => {
    const savedPreference = localStorage.getItem('theme-preference');
    if (savedPreference && ['light', 'dark'].includes(savedPreference)) {
      dispatch({
        type: ThemeActionTypes.SET_USER_PREFERENCE,
        payload: savedPreference
      });
    }
  }, []);

  // Sauvegarder la préférence utilisateur
  useEffect(() => {
    if (state.userPreference) {
      localStorage.setItem('theme-preference', state.userPreference);
    } else {
      localStorage.removeItem('theme-preference');
    }
  }, [state.userPreference]);

  // Appliquer le thème au document
  useEffect(() => {
    const root = document.documentElement;
    
    if (state.mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Appliquer la classe pour les transitions
    if (state.transitions && !state.reducedMotion) {
      root.classList.add('theme-transitions');
    } else {
      root.classList.remove('theme-transitions');
    }
  }, [state.mode, state.transitions, state.reducedMotion]);

  // Actions du thème
  const actions = {
    setTheme: (theme) => {
      dispatch({ type: ThemeActionTypes.SET_THEME, payload: theme });
    },
    
    toggleTheme: () => {
      dispatch({ type: ThemeActionTypes.TOGGLE_THEME });
    },
    
    setUserPreference: (preference) => {
      dispatch({ type: ThemeActionTypes.SET_USER_PREFERENCE, payload: preference });
    },
    
    resetToSystem: () => {
      dispatch({ type: ThemeActionTypes.SET_USER_PREFERENCE, payload: null });
    },
    
    setTransitions: (enabled) => {
      dispatch({ type: ThemeActionTypes.SET_TRANSITIONS, payload: enabled });
    }
  };

  const value = {
    ...state,
    ...actions,
    isDark: state.mode === 'dark',
    isLight: state.mode === 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;