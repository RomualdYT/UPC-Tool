import React, { useState, useEffect } from 'react';
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
  Database
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import UPCSync from './UPCSync';

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
  const [availableFilters, setAvailableFilters] = useState({
    courtDivisions: [],
    languages: [],
    caseTypes: [],
    tags: []
  });

  const itemsPerPage = 20;

  useEffect(() => {
    fetchCases();
    fetchAvailableFilters();
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
    setCurrentPage(1);
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const getCaseTypeBadge = (type) => {
    if (type === 'Order') {
      return 'legal-badge-primary';
    }
    return 'legal-badge-secondary';
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="gradient-legal shadow-legal-lg sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Gavel className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white font-display">
                UPC Legal
              </h1>
            </div>
            
            {/* Language Selector */}
            <div className="flex items-center space-x-4">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-legal-900 mb-4 font-display">
            {t('title')}
          </h2>
          <p className="text-xl text-legal-600 max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="card mb-8"
        >
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-legal-400" />
              <input
                type="text"
                placeholder={t('search.placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
              />
            </div>
            
            <div className="flex flex-wrap gap-4 items-center">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center space-x-2"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span>{t('search.button')}</span>
              </button>
              
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="btn-outline flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>{t('filters.dateRange')}</span>
                {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
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
                className="mt-6 pt-6 border-t border-gray-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-legal-700 mb-2">
                      {t('filters.dateRange')}
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                        className="input-field flex-1"
                      />
                      <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                        className="input-field flex-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-legal-700 mb-2">
                      {t('filters.caseType')}
                    </label>
                    <select
                      value={filters.caseType}
                      onChange={(e) => handleFilterChange('caseType', e.target.value)}
                      className="input-field w-full"
                    >
                      <option value="">All Types</option>
                      {(availableFilters.caseTypes || []).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-legal-700 mb-2">
                      {t('filters.courtDivision')}
                    </label>
                    <select
                      value={filters.courtDivision}
                      onChange={(e) => handleFilterChange('courtDivision', e.target.value)}
                      className="input-field w-full"
                    >
                      <option value="">All Divisions</option>
                      {(availableFilters.courtDivisions || []).map(division => (
                        <option key={division} value={division}>{division}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-legal-700 mb-2">
                      {t('filters.language')}
                    </label>
                    <select
                      value={filters.language}
                      onChange={(e) => handleFilterChange('language', e.target.value)}
                      className="input-field w-full"
                    >
                      <option value="">All Languages</option>
                      {(availableFilters.languages || []).map(lang => (
                        <option key={lang} value={lang}>{t(`languages.${lang.toLowerCase()}`)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-legal-500 hover:text-legal-700 font-medium"
                  >
                    {t('filters.clear')}
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
          className="card"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-legal-900 flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary-600" />
              <span>Cases Found: {totalCount}</span>
            </h3>
            
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="btn-outline px-3 py-1 text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-legal-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-outline px-3 py-1 text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="loading-dots">
                <div></div>
                <div></div>
                <div></div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {cases.map((case_item, index) => (
                <motion.div
                  key={case_item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="card-hover"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-3">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className={`legal-badge ${getCaseTypeBadge(case_item.type)}`}>
                            {case_item.type}
                          </span>
                          <span className="text-sm text-legal-500">
                            {formatDate(case_item.date)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-legal-400" />
                          <span className="text-sm text-legal-600">{case_item.court_division}</span>
                        </div>
                      </div>
                      
                      <h4 className="text-lg font-semibold text-legal-900 mb-2">
                        {case_item.reference}
                      </h4>
                      
                      <p className="text-legal-600 mb-3 line-clamp-3">
                        {case_item.summary}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {(case_item.parties || []).map((party, idx) => (
                          <span key={idx} className="legal-badge-gray flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>{party}</span>
                          </span>
                        ))}
                      </div>
                      
                      {(case_item.tags || []).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {(case_item.tags || []).map((tag, idx) => (
                            <span key={idx} className="legal-badge-success flex items-center space-x-1">
                              <Tag className="h-3 w-3" />
                              <span>{tag}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <div className="text-sm text-legal-500">
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
                        <button className="btn-primary text-sm py-2 flex items-center justify-center space-x-2">
                          <Eye className="h-4 w-4" />
                          <span>{t('actions.viewDetails')}</span>
                        </button>
                        
                        {(case_item.documents || []).length > 0 && (
                          <button className="btn-outline text-sm py-2 flex items-center justify-center space-x-2">
                            <Download className="h-4 w-4" />
                            <span>{t('actions.download')}</span>
                          </button>
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

      {/* Footer */}
      <footer className="bg-legal-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-legal-300 mb-2">
              {t('subscription.required')}
            </p>
            <button className="btn-secondary flex items-center space-x-2 mx-auto">
              <ExternalLink className="h-4 w-4" />
              <span>{t('subscription.subscribe')}</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;