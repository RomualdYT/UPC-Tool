import React, { useState } from 'react';
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
  Scale,
  Building2,
  Users,
  Tag,
  ExternalLink,
  Database,
  Flame,
  Table,
  BarChart3,
  ArrowLeft,
  ArrowRight,
  Shield,
  Star,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';

// Imports des composants
import UPCSync from './UPCSync';
import CaseDetail from './CaseDetail';
import DataTable from './DataTable';
import Dashboard from './Dashboard';
import AdminFullscreen from './AdminFullscreen';
import UPCCode from './UPCCode';
import { exportData, exportStats } from './ExportUtils';
import Notification from './Notification';

// Import du contexte de données
import { DataProvider, useData } from './contexts/DataContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthModal from './components/AuthModal';
import Footer from './components/Footer';
import UserMenu from './components/UserMenu';

// Composant principal de l'application
const AppContent = () => {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, isAdmin, canEdit } = useAuth();
  
  // État du contexte de données
  const {
    // Données
    allCases,
    filteredCases,
    availableFilters,
    stats,
    
    // État de chargement
    loading,
    syncing,
    
    // Filtres et pagination
    activeFilters,
    pagination,
    
    // Notification
    notification,
    
    // Actions
    updateFilter,
    clearFilters,
    updatePage,
    getPaginatedCases,
    fetchAllCases,
    updateCase,
    syncUPCData,
    setNotification,
    clearNotification
  } = useData();

  // État local pour l'interface
  const [showFilters, setShowFilters] = useState(false);
  const [showSync, setShowSync] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [detailError, setDetailError] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' ou 'table'
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'data', ou 'upc-code'
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  // Fonction d'export avec notification intégrée
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

  const handleSearch = (e) => {
    e.preventDefault();
    // La recherche est automatiquement gérée par le contexte
    updatePage(1);
  };

  const handleFilterChange = (filterName, value) => {
    updateFilter(filterName, value);
  };

  // Fonction pour changer de vue avec synchronisation automatique
  const handleViewModeChange = (newMode) => {
    setViewMode(newMode);
    updatePage(1);
    
    setNotification({
      message: `Vue ${newMode === 'table' ? 'tableau' : 'cartes'} avec ${filteredCases.length} décisions`,
      type: 'info',
      duration: 3000
    });
  };

  const handleNavigateToData = () => {
    setCurrentView('data');
  };

  const handleNavigateToDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleNavigateToUPCCode = () => {
    setCurrentView('upc-code');
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
    if (!caseId) {
      setDetailError("Aucune décision sélectionnée.");
      setSelectedCaseId(null);
      return;
    }
    const found = allCases.find(c => c.id === caseId);
    if (!found) {
      setDetailError("Décision introuvable ou supprimée.");
      setSelectedCaseId(null);
      return;
    }
    setDetailError(null);
    setSelectedCaseId(caseId);
  };

  // Fonction pour gérer la synchronisation UPC
  const handleUPCSync = async () => {
    const result = await syncUPCData();
    if (result.success) {
      setNotification({
        message: 'Synchronisation UPC démarrée',
        type: 'success',
        duration: 4000
      });
    } else {
      setNotification({
        message: `Erreur de synchronisation: ${result.error}`,
        type: 'error',
        duration: 5000
      });
    }
  };

  // Calculer les données paginées pour la vue cartes
  const paginatedCases = getPaginatedCases();
  const totalPages = Math.ceil(filteredCases.length / pagination.itemsPerPage);

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
                    <span>{t('dashboard', 'Dashboard')}</span>
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
                    <span>{t('data', 'Données')}</span>
                  </div>
                </button>
                <button
                  onClick={handleNavigateToUPCCode}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentView === 'upc-code' 
                      ? 'bg-white/30 text-white' 
                      : 'bg-white/20 text-white/80 hover:bg-white/30'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Scale className="h-4 w-4" />
                    <span>Code UPC</span>
                  </div>
                </button>
              </div>



              {/* Indicateur de synchronisation */}
              <button
                onClick={() => setShowSync(!showSync)}
                className={`p-2 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-colors ${
                  syncing ? 'bg-white/30 animate-pulse' : 'bg-white/20'
                }`}
                title="UPC Data Sync"
              >
                <Database className={`h-5 w-5 text-white ${syncing ? 'animate-spin' : ''}`} />
              </button>

              {/* Admin Button - only show if user is admin */}
              {isAdmin() && (
                <button
                  onClick={() => setShowAdmin(true)}
                  className="p-2 bg-white/20 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-colors"
                  title="Administration"
                >
                  <Shield className="h-5 w-5 text-white" />
                </button>
              )}

              {/* Authentication */}
              {isAuthenticated() ? (
                <UserMenu />
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setShowAuthModal(true);
                    }}
                    className="px-3 py-2 bg-white/20 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-colors text-white text-sm font-medium"
                  >
                    Connexion
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('register');
                      setShowAuthModal(true);
                    }}
                    className="px-3 py-2 bg-white/30 rounded-lg backdrop-blur-sm hover:bg-white/40 transition-colors text-white text-sm font-medium"
                  >
                    S'inscrire
                  </button>
                </div>
              )}
              
              <div className="relative">
                <select
                  value={i18n.language}
                  onChange={(e) => changeLanguage(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-white/20 text-white appearance-none pr-8 backdrop-blur-sm border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors h-[40px]"
                  style={{ minWidth: 64 }}
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
          <Dashboard 
            cases={allCases}
            stats={stats}
            loading={loading || allCases.length === 0}
            onNavigateToData={handleNavigateToData}
          />
        ) : currentView === 'upc-code' ? (
          <UPCCode 
            onBack={handleNavigateToDashboard}
            onViewCaseDetail={handleViewDetails}
          />
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
                  <UPCSync onSync={handleUPCSync} syncing={syncing} />
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
                    placeholder={t('search.placeholder', 'Search decisions and orders...')}
                    value={activeFilters.searchTerm}
                    onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
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
                    <span>{t('search.button', 'Search')}</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`romulus-btn-secondary flex items-center space-x-2 ${
                      Object.values(activeFilters).some(v => v) ? 'ring-2 ring-orange-500' : ''
                    }`}
                  >
                    <Filter className="h-4 w-4" />
                    <span>{t('filters.filters', 'Filters')}</span>
                    {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    {Object.values(activeFilters).some(v => v) && (
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
                    {Object.values(activeFilters).some(v => v) && (
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
                            value={activeFilters.dateFrom}
                            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                            className="input-field flex-1 border-orange-300 focus:ring-orange-500"
                          />
                          <input
                            type="date"
                            value={activeFilters.dateTo}
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
                          value={activeFilters.caseType}
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
                          value={activeFilters.courtDivision}
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
                          value={activeFilters.language}
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
                      Cases Found: {filteredCases.length}
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
                        onClick={() => updatePage(Math.max(1, pagination.currentPage - 1))}
                        disabled={pagination.currentPage === 1}
                        className="romulus-btn-secondary px-3 py-1 text-sm disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {pagination.currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => updatePage(Math.min(totalPages, pagination.currentPage + 1))}
                        disabled={pagination.currentPage === totalPages}
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
                allCases.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="loading-dots">
                      <div></div>
                      <div></div>
                      <div></div>
                    </div>
                  </div>
                ) : (
                  <DataTable 
                    data={filteredCases} 
                    onViewDetails={handleViewDetails}
                    onExport={handleExport}
                  />
                )
              ) : (
                <div className="space-y-4">
                  {paginatedCases.map((case_item, index) => (
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
                              {/* Badges d'administration */}
                              {case_item.apports && case_item.apports.length > 0 && (
                                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full flex items-center space-x-1">
                                  <Star className="h-3 w-3" />
                                  <span>Important</span>
                                </span>
                              )}
                              {case_item.admin_summary && (
                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full flex items-center space-x-1">
                                  <MessageSquare className="h-3 w-3" />
                                  <span>Commenté</span>
                                </span>
                              )}
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

                          {/* Informations d'administration */}
                          {case_item.admin_summary && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center space-x-2 mb-2">
                                <MessageSquare className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-800">Résumé par Casalonga</span>
                              </div>
                              <p className="text-sm text-blue-700 line-clamp-2">{case_item.admin_summary}</p>
                            </div>
                          )}

                          {case_item.apports && case_item.apports.length > 0 && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-center space-x-2 mb-2">
                                <Star className="h-4 w-4 text-red-600" />
                                <span className="text-sm font-medium text-red-800">Apports juridiques ({case_item.apports.length})</span>
                              </div>
                              <div className="space-y-2">
                                {case_item.apports.slice(0, 2).map((apport, idx) => (
                                  <div key={idx} className="text-sm">
                                    <span className="font-medium text-red-700">Art. {apport.article_number}</span>
                                    <span className="text-red-600"> - {apport.regulation}</span>
                                    {apport.citation && (
                                      <p className="text-xs text-red-600 mt-1 italic">"{apport.citation}"</p>
                                    )}
                                  </div>
                                ))}
                                {case_item.apports.length > 2 && (
                                  <p className="text-xs text-red-600">+{case_item.apports.length - 2} autres apports</p>
                                )}
                              </div>
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
      <Footer />

      {/* Case Detail Modal */}
      <AnimatePresence>
        {selectedCaseId && !detailError && (
          <CaseDetail
            caseId={selectedCaseId}
            onClose={() => setSelectedCaseId(null)}
          />
        )}
        {detailError && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-red-100 text-red-700 px-6 py-3 rounded-lg shadow-lg z-50">
            {detailError}
            <button onClick={() => setDetailError(null)} className="ml-4 text-red-900 underline">Fermer</button>
          </div>
        )}
      </AnimatePresence>

      {/* Notification System */}
      <AnimatePresence>
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            duration={notification.duration}
            onClose={clearNotification}
          />
        )}
      </AnimatePresence>

      {/* Admin Panel */}
      <AnimatePresence>
        {showAdmin && isAdmin() && (
          <AdminPanel 
            onClose={() => setShowAdmin(false)} 
            cases={allCases}
            onCaseUpdate={updateCase}
          />
        )}
      </AnimatePresence>

      {/* Authentication Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            initialMode={authMode}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Composant App principal avec Provider
function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}

export default App;