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
  Database,
  Flame
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import UPCSync from './UPCSync';
import CaseDetail from './CaseDetail';

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

  const totalPages = Math.ceil(totalCount / itemsPerPage);

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
            
            {/* Language Selector */}
            <div className="flex items-center space-x-4">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                className="romulus-btn-secondary flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
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
                className="mt-6 pt-6 border-t border-orange-200"
              >
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
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <FileText className="h-5 w-5 text-orange-600" />
              <span>Cases Found: {totalCount}</span>
            </h3>
            
            {totalPages > 1 && (
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
    </div>
  );
}

export default App;