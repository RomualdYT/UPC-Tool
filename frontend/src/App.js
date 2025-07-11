import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
  MessageSquare,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';

// Imports des composants
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
import { SEOProvider, useSEO } from './contexts/SEOContext';
import AuthModal from './components/AuthModal';
import Footer from './components/Footer';
import UserMenu from './components/UserMenu';

// Nouveaux composants SEO, GDPR et Newsletter
import MetaTags from './components/seo/MetaTags';
import Breadcrumb from './components/seo/Breadcrumb';
import { generateWebSiteStructuredData } from './components/seo/StructuredData';
import GDPRBanner from './components/gdpr/GDPRBanner';
import PrivacySettings from './components/gdpr/PrivacySettings';
import NewsletterSignup from './components/newsletter/NewsletterSignup';
import NewsletterManagement from './components/admin/NewsletterManagement';
import PermissionsManagement from './components/admin/PermissionsManagement';

// Composant principal de l'application
const AppContent = ({ onShowAdmin, onShowUPCCode }) => {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, isAdmin, canEdit } = useAuth();
  const { updatePageSEO, getPageSEO } = useSEO();
  
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
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [detailError, setDetailError] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' ou 'table'
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' ou 'data'
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  // SEO dynamique basé sur la vue
  useEffect(() => {
    const currentPageSEO = getPageSEO();
    
    // Mettre à jour les métadonnées SEO selon la vue
    if (currentView === 'dashboard') {
      updatePageSEO({
        title: 'Tableau de bord UPC Legal - Statistiques et analyses',
        description: 'Découvrez les statistiques complètes des décisions UPC, analyses par juridiction et tendances temporelles.',
        keywords: [...(currentPageSEO.keywords || []), 'tableau de bord', 'statistiques', 'analyse'],
        structuredData: generateWebSiteStructuredData()
      });
    } else if (currentView === 'data') {
      updatePageSEO({
        title: `Recherche UPC - ${filteredCases.length} décisions trouvées`,
        description: `Explorez ${filteredCases.length} décisions et ordonnances de la Cour Unifiée du Brevet avec nos filtres avancés.`,
        keywords: [...(currentPageSEO.keywords || []), 'recherche', 'décisions', 'filtres'],
        structuredData: generateWebSiteStructuredData()
      });
    }
  }, [currentView, filteredCases.length, updatePageSEO, getPageSEO]);

  // Fonction d'export avec notification intégrée
  const handleExport = (data) => {
    const result = exportData(data, 'excel', 'decisions_upc');
    if (result.success) {
      setNotification({
        message: `${t('notifications.exportSuccess')}: ${result.filename}`,
        type: 'success',
        duration: 4000
      });
    } else {
      setNotification({
        message: `${t('notifications.exportError')}: ${result.error}`,
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
        message: `${t('notifications.exportSuccess')}: ${result.filename}`,
        type: 'success',
        duration: 4000
      });
    } else {
      setNotification({
        message: `${t('notifications.exportError')}: ${result.error}`,
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
      message: `${t('notifications.viewTable')} ${newMode === 'table' ? t('notifications.viewTable') : t('notifications.viewCards')} avec ${filteredCases.length} ${t('notifications.decisions')}`,
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
    onShowUPCCode();
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

  // Calculer les données paginées pour la vue cartes
  const paginatedCases = getPaginatedCases();
  const totalPages = Math.ceil(filteredCases.length / pagination.itemsPerPage);

  // Obtenir les métadonnées SEO pour la page actuelle
  const currentSEO = getPageSEO();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      {/* SEO Meta Tags */}
      <MetaTags {...currentSEO} />

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
                UPC Legal
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
                    <span>{t('navigation.dashboard')}</span>
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
                    <span>{t('navigation.data')}</span>
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
                    <span>{t('navigation.upcCode')}</span>
                  </div>
                </button>
              </div>

              {/* Admin Button - only show if user is admin */}
              {isAdmin() && (
                <button
                  onClick={onShowAdmin}
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
                    {t('auth.login')}
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('register');
                      setShowAuthModal(true);
                    }}
                    className="px-3 py-2 bg-white/30 rounded-lg backdrop-blur-sm hover:bg-white/40 transition-colors text-white text-sm font-medium"
                  >
                    {t('auth.register')}
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

      {/* Breadcrumb (seulement pour les pages de données) */}
      {currentView !== 'dashboard' && <Breadcrumb />}

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {currentView === 'dashboard' ? (
          <Dashboard 
            cases={allCases}
            stats={stats}
            loading={loading || allCases.length === 0}
            onNavigateToData={handleNavigateToData}
            onNavigateToUPCCode={handleNavigateToUPCCode}
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
                <span>{t('navigation.backToDashboard')}</span>
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
                Décisions et Ordonnances UPC
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Recherchez et analysez instantanément les décisions et ordonnances de la Cour Unifiée du Brevet
              </p>
            </motion.div>

            {/* Newsletter Signup */}
            {!isAuthenticated() && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mb-8"
              >
                <NewsletterSignup 
                  onSuccess={() => {
                    setNotification({
                      message: 'Inscription réussie ! Merci de votre intérêt.',
                      type: 'success',
                      duration: 4000
                    });
                  }}
                  onError={(error) => {
                    setNotification({
                      message: 'Erreur lors de l\'inscription à la newsletter.',
                      type: 'error',
                      duration: 4000
                    });
                  }}
                />
              </motion.div>
            )}

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
                    placeholder={t('search.placeholder', 'Rechercher dans les décisions et ordonnances...')}
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
                    <span>{t('search.button', 'Rechercher')}</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`romulus-btn-secondary flex items-center space-x-2 ${
                      Object.values(activeFilters).some(v => v) ? 'ring-2 ring-orange-500' : ''
                    }`}
                  >
                    <Filter className="h-4 w-4" />
                    <span>{t('filters.filters', 'Filtres')}</span>
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
                          Période
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
                          Type de cas
                        </label>
                        <select
                          value={activeFilters.caseType}
                          onChange={(e) => handleFilterChange('caseType', e.target.value)}
                          className="input-field w-full border-orange-300 focus:ring-orange-500"
                        >
                          <option value="">Tous les types</option>
                          {(availableFilters.caseTypes || []).map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Division
                        </label>
                        <select
                          value={activeFilters.courtDivision}
                          onChange={(e) => handleFilterChange('courtDivision', e.target.value)}
                          className="input-field w-full border-orange-300 focus:ring-orange-500"
                        >
                          <option value="">Toutes les divisions</option>
                          {(availableFilters.courtDivisions || []).map(division => (
                            <option key={division} value={division}>{division}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Langue
                        </label>
                        <select
                          value={activeFilters.language}
                          onChange={(e) => handleFilterChange('language', e.target.value)}
                          className="input-field w-full border-orange-300 focus:ring-orange-500"
                        >
                          <option value="">Toutes les langues</option>
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
                      Décisions trouvées : {filteredCases.length}
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
                        Précédent
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {pagination.currentPage} sur {totalPages}
                      </span>
                      <button
                        onClick={() => updatePage(Math.min(totalPages, pagination.currentPage + 1))}
                        disabled={pagination.currentPage === totalPages}
                        className="romulus-btn-secondary px-3 py-1 text-sm disabled:opacity-50"
                      >
                        Suivant
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
                            {case_item.registry_number}
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
                                <span className="text-sm font-medium text-blue-800">Résumé administratif</span>
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
                              <span>Registre: {case_item.registry_number}</span>
                            </div>
                            <div className="flex items-center space-x-2 mb-1">
                              <Globe className="h-3 w-3" />
                              <span>Langue: {case_item.language_of_proceedings}</span>
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
                              <span>Voir détails</span>
                            </button>
                            
                            {(case_item.documents || []).length > 0 && (
                              <a
                                href={(case_item.documents || [])[0]?.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="romulus-btn-secondary text-sm py-2 flex items-center justify-center space-x-2"
                              >
                                <Download className="h-4 w-4" />
                                <span>Télécharger</span>
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

      {/* GDPR Banner */}
      <GDPRBanner />

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

// Page de paramètres de confidentialité
const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PrivacySettings />
      </div>
    </div>
  );
};

// Composant App principal avec Router et Providers
function App() {
  return (
    <AuthProvider>
      <SEOProvider>
        <DataProvider>
          <Router>
            <Routes>
              <Route path="/" element={<AppWrapper />} />
              <Route path="/search" element={<AppWrapper />} />
              <Route path="/cases/:id" element={<AppWrapper />} />
              <Route path="/upc-code" element={<AppWrapper />} />
              <Route path="/dashboard" element={<AppWrapper />} />
              <Route path="/privacy-settings" element={<PrivacyPage />} />
              <Route path="/admin" element={<AppWrapper />} />
              <Route path="/admin/newsletter" element={<AppWrapper />} />
              <Route path="/admin/permissions" element={<AppWrapper />} />
            </Routes>
          </Router>
        </DataProvider>
      </SEOProvider>
    </AuthProvider>
  );
}

// Wrapper pour gérer l'administration et le Code UPC
const AppWrapper = () => {
  const { isAdmin } = useAuth();
  const [showAdmin, setShowAdmin] = useState(false);
  const [showUPCCode, setShowUPCCode] = useState(false);
  const [adminView, setAdminView] = useState('main');
  const { allCases, updateCase } = useData();
  const location = useLocation();

  // Détecter la vue admin basée sur l'URL
  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      setShowAdmin(true);
      if (location.pathname.includes('/newsletter')) {
        setAdminView('newsletter');
      } else if (location.pathname.includes('/permissions')) {
        setAdminView('permissions');
      } else {
        setAdminView('main');
      }
    } else if (location.pathname.startsWith('/upc-code')) {
      setShowUPCCode(true);
    } else {
      setShowAdmin(false);
      setShowUPCCode(false);
    }
  }, [location.pathname]);

  // Composant Admin avec gestion des sous-vues
  const AdminComponent = () => {
    if (adminView === 'newsletter') {
      return <NewsletterManagement />;
    } else if (adminView === 'permissions') {
      return <PermissionsManagement />;
    } else {
      return (
        <AdminFullscreen 
          onClose={() => setShowAdmin(false)} 
          cases={allCases}
          onCaseUpdate={updateCase}
          onShowNewsletter={() => setAdminView('newsletter')}
          onShowPermissions={() => setAdminView('permissions')}
        />
      );
    }
  };

  return (
    <>
      {showAdmin && isAdmin() ? (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AdminComponent />
          </div>
        </div>
      ) : showUPCCode ? (
        <UPCCode 
          onBack={() => setShowUPCCode(false)}
          onViewCaseDetail={(caseId) => {
            console.log('Open case detail:', caseId);
          }}
        />
      ) : (
        <AppContent 
          onShowAdmin={() => setShowAdmin(true)}
          onShowUPCCode={() => setShowUPCCode(true)}
        />
      )}
    </>
  );
};

export default App;