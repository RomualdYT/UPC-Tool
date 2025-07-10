import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// État initial
const initialState = {
  // Données principales
  allCases: [],
  filteredCases: [],
  availableFilters: {
    courtDivisions: [],
    languages: [],
    caseTypes: [],
    tags: []
  },
  
  // État de chargement
  loading: false,
  syncing: false,
  
  // Filtres actifs
  activeFilters: {
    searchTerm: '',
    dateFrom: '',
    dateTo: '',
    caseType: '',
    courtDivision: '',
    language: ''
  },
  
  // Pagination pour la vue cartes
  pagination: {
    currentPage: 1,
    itemsPerPage: 20,
    totalCount: 0
  },
  
  // Statistiques
  stats: {
    totalCases: 0,
    casesByType: {},
    casesByDivision: {},
    casesByLanguage: {},
    casesByMonth: {},
    recentCases: []
  },
  
  // État de synchronisation
  lastSync: null,
  error: null,
  notification: null
};

// Types d'actions
const ActionTypes = {
  // Chargement des données
  SET_LOADING: 'SET_LOADING',
  SET_SYNCING: 'SET_SYNCING',
  SET_ERROR: 'SET_ERROR',
  
  // Données
  SET_ALL_CASES: 'SET_ALL_CASES',
  SET_FILTERED_CASES: 'SET_FILTERED_CASES',
  SET_AVAILABLE_FILTERS: 'SET_AVAILABLE_FILTERS',
  UPDATE_CASE: 'UPDATE_CASE',
  ADD_CASE: 'ADD_CASE',
  
  // Filtres
  SET_ACTIVE_FILTERS: 'SET_ACTIVE_FILTERS',
  UPDATE_FILTER: 'UPDATE_FILTER',
  CLEAR_FILTERS: 'CLEAR_FILTERS',
  
  // Pagination
  SET_PAGINATION: 'SET_PAGINATION',
  UPDATE_PAGE: 'UPDATE_PAGE',
  
  // Statistiques
  UPDATE_STATS: 'UPDATE_STATS',
  
  // Notification
  SET_NOTIFICATION: 'SET_NOTIFICATION',
  CLEAR_NOTIFICATION: 'CLEAR_NOTIFICATION',
  
  // Synchronisation
  SET_LAST_SYNC: 'SET_LAST_SYNC'
};

// Reducer pour gérer l'état
const dataReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
      
    case ActionTypes.SET_SYNCING:
      return { ...state, syncing: action.payload };
      
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload };
      
    case ActionTypes.SET_ALL_CASES:
      const newStats = calculateStats(action.payload);
      const newFilteredCases = applyFilters(action.payload, state.activeFilters);
      return { 
        ...state, 
        allCases: action.payload,
        filteredCases: newFilteredCases,
        stats: newStats,
        pagination: {
          ...state.pagination,
          totalCount: newFilteredCases.length
        }
      };
      
    case ActionTypes.SET_FILTERED_CASES:
      return { 
        ...state, 
        filteredCases: action.payload,
        pagination: {
          ...state.pagination,
          totalCount: action.payload.length
        }
      };
      
    case ActionTypes.SET_AVAILABLE_FILTERS:
      return { ...state, availableFilters: action.payload };
      
    case ActionTypes.UPDATE_CASE:
      const updatedAllCases = state.allCases.map(c => 
        c.id === action.payload.id ? action.payload : c
      );
      const updatedStats = calculateStats(updatedAllCases);
      const updatedFilteredCases = applyFilters(updatedAllCases, state.activeFilters);
      return { 
        ...state, 
        allCases: updatedAllCases,
        filteredCases: updatedFilteredCases,
        stats: updatedStats
      };
      
    case ActionTypes.ADD_CASE:
      const newAllCases = [...state.allCases, action.payload];
      const newStatsForAdd = calculateStats(newAllCases);
      const newFilteredForAdd = applyFilters(newAllCases, state.activeFilters);
      return { 
        ...state, 
        allCases: newAllCases,
        filteredCases: newFilteredForAdd,
        stats: newStatsForAdd
      };
      
    case ActionTypes.SET_ACTIVE_FILTERS:
      const filteredAfterUpdate = applyFilters(state.allCases, action.payload);
      return { 
        ...state, 
        activeFilters: action.payload,
        filteredCases: filteredAfterUpdate,
        pagination: {
          ...state.pagination,
          currentPage: 1,
          totalCount: filteredAfterUpdate.length
        }
      };
      
    case ActionTypes.UPDATE_FILTER:
      const updatedFilters = {
        ...state.activeFilters,
        [action.payload.name]: action.payload.value
      };
      const filteredAfterSingleUpdate = applyFilters(state.allCases, updatedFilters);
      return { 
        ...state, 
        activeFilters: updatedFilters,
        filteredCases: filteredAfterSingleUpdate,
        pagination: {
          ...state.pagination,
          currentPage: 1,
          totalCount: filteredAfterSingleUpdate.length
        }
      };
      
    case ActionTypes.CLEAR_FILTERS:
      const clearedFilters = {
        searchTerm: '',
        dateFrom: '',
        dateTo: '',
        caseType: '',
        courtDivision: '',
        language: ''
      };
      return { 
        ...state, 
        activeFilters: clearedFilters,
        filteredCases: state.allCases,
        pagination: {
          ...state.pagination,
          currentPage: 1,
          totalCount: state.allCases.length
        }
      };
      
    case ActionTypes.SET_PAGINATION:
      return { ...state, pagination: { ...state.pagination, ...action.payload } };
      
    case ActionTypes.UPDATE_PAGE:
      return { 
        ...state, 
        pagination: { ...state.pagination, currentPage: action.payload } 
      };
      
    case ActionTypes.UPDATE_STATS:
      return { ...state, stats: action.payload };
      
    case ActionTypes.SET_NOTIFICATION:
      return { ...state, notification: action.payload };
      
    case ActionTypes.CLEAR_NOTIFICATION:
      return { ...state, notification: null };
      
    case ActionTypes.SET_LAST_SYNC:
      return { ...state, lastSync: action.payload };
      
    default:
      return state;
  }
};

// Fonction pour calculer les statistiques
const calculateStats = (cases) => {
  const stats = {
    totalCases: cases.length,
    casesByType: {},
    casesByDivision: {},
    casesByLanguage: {},
    casesByMonth: {},
    recentCases: [...cases].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
  };

  cases.forEach(case_item => {
    // Par type
    stats.casesByType[case_item.type] = (stats.casesByType[case_item.type] || 0) + 1;
    
    // Par division
    stats.casesByDivision[case_item.court_division] = (stats.casesByDivision[case_item.court_division] || 0) + 1;
    
    // Par langue
    stats.casesByLanguage[case_item.language_of_proceedings] = (stats.casesByLanguage[case_item.language_of_proceedings] || 0) + 1;
    
    // Par mois
    try {
      const date = new Date(case_item.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      stats.casesByMonth[monthKey] = (stats.casesByMonth[monthKey] || 0) + 1;
    } catch (error) {
      console.warn('Invalid date format:', case_item.date);
    }
  });

  return stats;
};

// Fonction pour appliquer les filtres
const applyFilters = (cases, filters) => {
  return cases.filter(case_item => {
    // Filtre de recherche
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const searchableFields = [
        case_item.reference,
        case_item.summary,
        case_item.type,
        case_item.court_division,
        case_item.registry_number,
        case_item.language_of_proceedings,
        case_item.type_of_action,
        Array.isArray(case_item.parties) ? case_item.parties.join(' ') : case_item.parties,
        Array.isArray(case_item.tags) ? case_item.tags.join(' ') : case_item.tags
      ].filter(Boolean).join(' ').toLowerCase();
      
      if (!searchableFields.includes(searchLower)) {
        return false;
      }
    }

    // Filtres par date
    if (filters.dateFrom) {
      try {
        const caseDate = new Date(case_item.date);
        const fromDate = new Date(filters.dateFrom);
        if (caseDate < fromDate) return false;
      } catch (error) {
        console.warn('Date comparison error:', error);
      }
    }

    if (filters.dateTo) {
      try {
        const caseDate = new Date(case_item.date);
        const toDate = new Date(filters.dateTo);
        if (caseDate > toDate) return false;
      } catch (error) {
        console.warn('Date comparison error:', error);
      }
    }

    // Filtre par type de cas
    if (filters.caseType && case_item.type !== filters.caseType) {
      return false;
    }

    // Filtre par division
    if (filters.courtDivision && case_item.court_division !== filters.courtDivision) {
      return false;
    }

    // Filtre par langue
    if (filters.language && case_item.language_of_proceedings !== filters.language) {
      return false;
    }

    return true;
  });
};

// Création du contexte
const DataContext = createContext();

// Hook pour utiliser le contexte
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Provider du contexte
export const DataProvider = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  // Actions
  const actions = {
    // Gestion des notifications
    setNotification: useCallback((notification) => {
      dispatch({ type: ActionTypes.SET_NOTIFICATION, payload: notification });
      
      // Auto-clear après la durée spécifiée
      if (notification?.duration) {
        setTimeout(() => {
          dispatch({ type: ActionTypes.CLEAR_NOTIFICATION });
        }, notification.duration);
      }
    }, []),
    
    clearNotification: useCallback(() => {
      dispatch({ type: ActionTypes.CLEAR_NOTIFICATION });
    }, []),
    
    // Chargement des données
    fetchAllCases: useCallback(async () => {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.SET_ERROR, payload: null });
      
      try {
        const response = await axios.get(`${BACKEND_URL}/api/cases?limit=1000`);
        dispatch({ type: ActionTypes.SET_ALL_CASES, payload: response.data });
        dispatch({ type: ActionTypes.SET_LAST_SYNC, payload: new Date().toISOString() });
        
        return { success: true, data: response.data };
      } catch (error) {
        const errorMsg = error.response?.data?.detail || 'Erreur lors du chargement des données';
        dispatch({ type: ActionTypes.SET_ERROR, payload: errorMsg });
        console.error('Error fetching all cases:', error);
        return { success: false, error: errorMsg };
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    }, []),
    
    // Chargement des filtres disponibles
    fetchAvailableFilters: useCallback(async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/filters`);
        dispatch({ type: ActionTypes.SET_AVAILABLE_FILTERS, payload: response.data });
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Error fetching filters:', error);
        return { success: false, error: error.message };
      }
    }, []),
    
    // Mise à jour d'un cas
    updateCase: useCallback(async (caseId, updateData) => {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      try {
        const response = await axios.put(`${BACKEND_URL}/api/cases/${caseId}`, updateData);
        dispatch({ type: ActionTypes.UPDATE_CASE, payload: response.data });
        
        return { success: true, data: response.data };
      } catch (error) {
        const errorMsg = error.response?.data?.detail || 'Erreur lors de la mise à jour';
        dispatch({ type: ActionTypes.SET_ERROR, payload: errorMsg });
        return { success: false, error: errorMsg };
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    }, []),
    
    // Synchronisation UPC
    syncUPCData: useCallback(async () => {
      dispatch({ type: ActionTypes.SET_SYNCING, payload: true });
      dispatch({ type: ActionTypes.SET_ERROR, payload: null });
      
      try {
        const response = await axios.post(`${BACKEND_URL}/api/sync/upc`);
        
        // Attendre un peu puis recharger les données
        setTimeout(async () => {
          await actions.fetchAllCases();
          dispatch({ type: ActionTypes.SET_SYNCING, payload: false });
        }, 5000);
        
        return { success: true, message: response.data.message };
      } catch (error) {
        const errorMsg = error.response?.data?.detail || 'Erreur lors de la synchronisation';
        dispatch({ type: ActionTypes.SET_ERROR, payload: errorMsg });
        dispatch({ type: ActionTypes.SET_SYNCING, payload: false });
        return { success: false, error: errorMsg };
      }
    }, []),
    
    // Gestion des filtres
    updateFilter: useCallback((name, value) => {
      dispatch({ type: ActionTypes.UPDATE_FILTER, payload: { name, value } });
    }, []),
    
    setFilters: useCallback((filters) => {
      dispatch({ type: ActionTypes.SET_ACTIVE_FILTERS, payload: filters });
    }, []),
    
    clearFilters: useCallback(() => {
      dispatch({ type: ActionTypes.CLEAR_FILTERS });
    }, []),
    
    // Gestion de la pagination
    updatePage: useCallback((page) => {
      dispatch({ type: ActionTypes.UPDATE_PAGE, payload: page });
    }, []),
    
    setPagination: useCallback((paginationData) => {
      dispatch({ type: ActionTypes.SET_PAGINATION, payload: paginationData });
    }, []),
    
    // Obtenir les cas paginés pour la vue cartes
    getPaginatedCases: useCallback(() => {
      const { currentPage, itemsPerPage } = state.pagination;
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return state.filteredCases.slice(startIndex, endIndex);
    }, [state.filteredCases, state.pagination])
  };

  // Chargement initial des données
  useEffect(() => {
    actions.fetchAllCases();
    actions.fetchAvailableFilters();
  }, []);

  const value = {
    // État
    ...state,
    
    // Actions
    ...actions
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export default DataContext;