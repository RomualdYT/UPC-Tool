import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Globe, 
  FileText, 
  Download, 
  Eye, 
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Gavel,
  Scale,
  Building2,
  Users,
  Tag,
  ExternalLink,
  Settings,
  Database,
  Flame,
  Table,
  BarChart3,
  ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import UPCSync from './UPCSync';
import CaseDetail from './CaseDetail';
import DataTable from './DataTable';
import Dashboard from './Dashboard';
import { exportData, exportStats } from './ExportUtils';
import Notification from './Notification';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const { t, i18n } = useTranslation();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    caseType: '',
    courtDivision: '',
    language: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showSync, setShowSync] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [availableFilters, setAvailableFilters] = useState({
    courtDivisions: [],
    languages: [],
    caseTypes: [],
    tags: []
  });
  const [viewMode, setViewMode] = useState('cards'); // 'cards' ou 'table'
  const [allCases, setAllCases] = useState([]); // Toutes les données pour le tableau
  const [filteredCases, setFilteredCases] = useState([]); // Données filtrées pour le tableau
  const [notification, setNotification] = useState(null); // Notification système
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' ou 'data'

  const itemsPerPage = 20;

  // Fonction pour filtrer les données localement
  const filterCases = useCallback((cases, searchTerm, filters) => {
    return cases.filter(case_item => {
      // Filtre de recherche
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
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
        const caseDate = new Date(case_item.date);
        const fromDate = new Date(filters.dateFrom);
        if (caseDate < fromDate) return false;
      }

      if (filters.dateTo) {
        const caseDate = new Date(case_item.date);
        const toDate = new Date(filters.dateTo);
        if (caseDate > toDate) return false;
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
  }, []);

  // Effet pour mettre à jour les données filtrées
  useEffect(() => {
    const filtered = filterCases(allCases, searchTerm, filters);
    setFilteredCases(filtered);
  }, [allCases, searchTerm, filters, filterCases]);

  useEffect(() => {
    fetchCases();
    fetchAvailableFilters();
    fetchAllCases(); // Récupérer toutes les données pour le tableau
  }, [currentPage, searchTerm, filters]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        skip: (currentPage - 1) * itemsPerPage,
        limit: itemsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(filters.dateFrom && { date_from: filters.dateFrom }),
        ...(filters.dateTo && { date_to: filters.dateTo }),
        ...(filters.caseType && { case_type: filters.caseType }),
        ...(filters.courtDivision && { court_division: filters.courtDivision }),
        ...(filters.language && { language: filters.language })
      });

      const response = await axios.get(`${BACKEND_URL}/api/cases?${params}`);
      setCases(response.data);

      // Fetch count
      const countResponse = await axios.get(`${BACKEND_URL}/api/cases/count?${params}`);
      setTotalCount(countResponse.data.count);
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer toutes les données (pour le tableau)
  const fetchAllCases = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/cases?limit=1000`);
      setAllCases(response.data);
      // Initialiser les données filtrées avec toutes les données
      setFilteredCases(response.data);
    } catch (error) {
      console.error('Error fetching all cases:', error);
    }
  };

  // Fonction d'export
  const handleExport = (data) => {
    const result = exportData(data, 'excel', 'decisions_upc');
    if (result.success) {
      setNotification({
        message: `Export réussi: ${result.filename}`,
        type: 'success',
        duration: 4000
      });
    } else {
      setNotification({
        message: `Erreur d'export: ${result.error}`,
        type: 'error',
        duration: 5000
      });
    }
  };

  // Fonction d'export des statistiques
  const handleExportStats = () => {
    const dataToExport = viewMode === 'table' ? filteredCases : allCases;
    const filename = viewMode === 'table' ? 'statistiques_upc_filtrees' : 'statistiques_upc';
    const result = exportStats(dataToExport, filename);
    if (result.success) {
      setNotification({
        message: `Export des statistiques réussi: ${result.filename}`,
        type: 'success',
        duration: 4000
      });
    } else {
      setNotification({
        message: `Erreur d'export: ${result.error}`,
        type: 'error',
        duration: 5000
      });
    }
  };

  const fetchAvailableFilters = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/filters`);
      setAvailableFilters(response.data);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCases();
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      caseType: '',
      courtDivision: '',
      language: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Fonction pour changer de vue avec synchronisation
  const handleViewModeChange = (newMode) => {
    setViewMode(newMode);
    // Réinitialiser la page quand on change de vue
    setCurrentPage(1);
    
    // Afficher une notification si des filtres sont actifs
    if (newMode === 'table' && (searchTerm || Object.values(filters).some(v => v))) {
      setNotification({
        message: `Vue tableau avec ${totalFilteredCount} résultats filtrés sur ${totalCount} total`,
        type: 'info',
        duration: 3000
      });
    }
  };

  const handleNavigateToData = () => {
    setCurrentView('data');
  };

  const handleNavigateToDashboard = () => {
    setCurrentView('dashboard');
  };

  // Fonction pour fermer la notification
  const closeNotification = () => {
    setNotification(null);
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const getCaseTypeBadge = (type) => {
    if (type === 'Order') {
      return 'romulus-badge-primary';
    }
    return 'romulus-badge-secondary';
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const handleViewDetails = (caseId) => {
    setSelectedCaseId(caseId);
  };

  // Calculer le nombre total de pages et le nombre total d'éléments selon la vue
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const totalFilteredCount = filteredCases.length;
  const displayCount = viewMode === 'table' ? totalFilteredCount : totalCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="gradient-primary shadow-orange-lg sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Flame className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white font-display">
                Romulus 2
              </h1>
            </div>
            
            {/* Navigation and Controls */}
            <div className="flex items-center space-x-4">
              {/* Navigation Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleNavigateToDashboard}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentView === 'dashboard' 
                      ? 'bg-white/30 text-white' 
                      : 'bg-white/20 text-white/80 hover:bg-white/30'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Dashboard</span>
                  </div>
                </button>
                <button
                  onClick={handleNavigateToData}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentView === 'data' 
                      ? 'bg-white/30 text-white' 
                      : 'bg-white/20 text-white/80 hover:bg-white/30'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Données</span>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setShowSync(!showSync)}
                className="p-2 bg-white/20 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-colors"
                title="UPC Data Sync"
              >
                <Database className="h-5 w-5 text-white" />
              </button>
              
              <div className="relative">
                <select
                  value={i18n.language}
                  onChange={(e) => changeLanguage(e.target.value)}
                  className="appearance-none bg-white/20 text-white rounded-lg px-3 py-2 pr-8 backdrop-blur-sm border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <option value="en">EN</option>
                  <option value="fr">FR</option>
                  <option value="de">DE</option>
                </select>
                <Globe className="absolute right-2 top-2.5 h-4 w-4 text-white pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {currentView === 'dashboard' ? (
          <Dashboard onNavigateToData={handleNavigateToData} />
        ) : (
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back to Dashboard Button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <button
                onClick={handleNavigateToDashboard}
                className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Retour au tableau de bord</span>
              </button>
            </motion.div>

            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-4 font-display">
                UPC Decisions and Orders
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Instantly search and analyze Unified Patent Court decisions and orders
              </p>
            </motion.div>

            {/* UPC Sync Section */}
            <AnimatePresence>
              {showSync && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <UPCSync />
                </motion.div>
              )}
            </AnimatePresence>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="romulus-card mb-8"
        >
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search decisions and orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg"
              />
            </div>
            
            <div className="flex flex-wrap gap-4 items-center">
              <button
                type="submit"
                disabled={loading}
                className="romulus-btn-primary flex items-center space-x-2"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span>Search</span>
              </button>
              
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`romulus-btn-secondary flex items-center space-x-2 ${
                  (searchTerm || Object.values(filters).some(v => v)) ? 'ring-2 ring-orange-500' : ''
                }`}
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {(searchTerm || Object.values(filters).some(v => v)) && (
                  <span className="ml-1 w-2 h-2 bg-orange-500 rounded-full"></span>
                )}
              </button>
            </div>
          </form>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6 pt-6 border-t border-orange-200"
              >
                {/* Indicateur de filtres actifs */}
                {(searchTerm || Object.values(filters).some(v => v)) && (
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Filter className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-800">
                          Filtres actifs
                        </span>
                      </div>
                      <button
                        onClick={clearFilters}
                        className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                      >
                        Effacer tous les filtres
                      </button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date Range
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                        className="input-field flex-1 border-orange-300 focus:ring-orange-500"
                      />
                      <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                        className="input-field flex-1 border-orange-300 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Case Type
                    </label>
                    <select
                      value={filters.caseType}
                      onChange={(e) => handleFilterChange('caseType', e.target.value)}
                      className="input-field w-full border-orange-300 focus:ring-orange-500"
                    >
                      <option value="">All Types</option>
                      {(availableFilters.caseTypes || []).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Court Division
                    </label>
                    <select
                      value={filters.courtDivision}
                      onChange={(e) => handleFilterChange('courtDivision', e.target.value)}
                      className="input-field w-full border-orange-300 focus:ring-orange-500"
                    >
                      <option value="">All Divisions</option>
                      {(availableFilters.courtDivisions || []).map(division => (
                        <option key={division} value={division}>{division}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <select
                      value={filters.language}
                      onChange={(e) => handleFilterChange('language', e.target.value)}
                      className="input-field w-full border-orange-300 focus:ring-orange-500"
                    >
                      <option value="">All Languages</option>
                      {(availableFilters.languages || []).map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Clear Filters
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="romulus-card"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <FileText className="h-5 w-5 text-orange-600" />
                <span>
                  {viewMode === 'table' ? 'Cases Found' : 'Cases Found'}: {displayCount}
                  {viewMode === 'table' && totalFilteredCount !== totalCount && (
                    <span className="text-sm text-gray-500 ml-2">
                      (filtré sur {totalCount} total)
                    </span>
                  )}
                </span>
              </h3>
              
              {/* Boutons de changement de vue */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleViewModeChange('cards')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'cards' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <FileText className="h-4 w-4" />
                    <span>Cartes</span>
                  </div>
                </button>
                <button
                  onClick={() => handleViewModeChange('table')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'table' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <Table className="h-4 w-4" />
                    <span>Tableau</span>
                  </div>
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {viewMode === 'cards' && totalPages > 1 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="romulus-btn-secondary px-3 py-1 text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="romulus-btn-secondary px-3 py-1 text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
              
              <button
                onClick={handleExportStats}
                className="romulus-btn-secondary flex items-center space-x-2"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Stats</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="loading-dots">
                <div></div>
                <div></div>
                <div></div>
              </div>
            </div>
          ) : viewMode === 'table' ? (
            <DataTable 
              data={filteredCases} 
              onViewDetails={handleViewDetails}
              onExport={handleExport}
            />
          ) : (
            <div className="space-y-4">
              {cases.map((case_item, index) => (
                <motion.div
                  key={case_item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="romulus-card"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-3">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className={`romulus-badge ${getCaseTypeBadge(case_item.type)}`}>
                            {case_item.type}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDate(case_item.date)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{case_item.court_division}</span>
                        </div>
                      </div>
                      
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {case_item.reference}
                      </h4>
                      
                      <p className="text-gray-600 mb-3 line-clamp-3">
                        {case_item.summary}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {(case_item.parties || []).map((party, idx) => (
                          <span key={idx} className="romulus-badge-secondary flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>{party}</span>
                          </span>
                        ))}
                      </div>
                      
                      {(case_item.tags || []).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {(case_item.tags || []).map((tag, idx) => (
                            <span key={idx} className="romulus-badge-secondary flex items-center space-x-1">
                              <Tag className="h-3 w-3" />
                              <span>{tag}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <div className="text-sm text-gray-500">
                        <div className="flex items-center space-x-2 mb-1">
                          <Scale className="h-3 w-3" />
                          <span>Registry: {case_item.registry_number}</span>
                        </div>
                        <div className="flex items-center space-x-2 mb-1">
                          <Globe className="h-3 w-3" />
                          <span>Language: {case_item.language_of_proceedings}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FileText className="h-3 w-3" />
                          <span>Action: {case_item.type_of_action}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2 pt-2">
                        <button 
                          onClick={() => handleViewDetails(case_item.id)}
                          className="romulus-btn-primary text-sm py-2 flex items-center justify-center space-x-2"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View Details</span>
                        </button>
                        
                        {(case_item.documents || []).length > 0 && (
                          <a
                            href={(case_item.documents || [])[0]?.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="romulus-btn-secondary text-sm py-2 flex items-center justify-center space-x-2"
                          >
                            <Download className="h-4 w-4" />
                            <span>Download</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-300 mb-2">
              Powered by Romulus 2 - Advanced UPC Legal Analysis
            </p>
            <button className="romulus-btn-secondary flex items-center space-x-2 mx-auto">
              <ExternalLink className="h-4 w-4" />
              <span>Learn More</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Case Detail Modal */}
      <AnimatePresence>
        {selectedCaseId && (
          <CaseDetail
            caseId={selectedCaseId}
            onClose={() => setSelectedCaseId(null)}
          />
        )}
      </AnimatePresence>

      {/* Notification System */}
      <AnimatePresence>
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            duration={notification.duration}
            onClose={closeNotification}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;