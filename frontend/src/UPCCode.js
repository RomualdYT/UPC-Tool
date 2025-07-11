import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Book,
  ChevronRight,
  ChevronDown,
  Search,
  ExternalLink,
  Users,
  Calendar,
  FileText,
  Quote,
  ArrowLeft,
  Filter,
  Globe,
  Scale,
  Gavel,
  Star,
  MessageSquare,
  Eye,
  Info,
  Download,
  RefreshCw,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import UPCTextLoader from './UPCTextLoader';
import { useTranslation } from 'react-i18next';

const UPCCode = ({ onBack }) => {
  const { t, i18n } = useTranslation();
  const [upcTexts, setUpcTexts] = useState([]);
  const [structure, setStructure] = useState({});
  const [selectedText, setSelectedText] = useState(null);
  const [linkedCases, setLinkedCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocType, setSelectedDocType] = useState('');
  const [showCrosReferences, setShowCrosReferences] = useState(false);
  const [showTextLoader, setShowTextLoader] = useState(false);

  // Fetch UPC structure and texts
  useEffect(() => {
    fetchUPCStructure();
    fetchUPCTexts();
  }, [selectedDocType]);

  const fetchUPCStructure = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/upc-texts/structure`);
      const data = await response.json();
      setStructure(data);
    } catch (error) {
      console.error('Error fetching UPC structure:', error);
    }
  };

  const fetchUPCTexts = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const params = new URLSearchParams();
      if (selectedDocType) params.append('document_type', selectedDocType);
      
      const response = await fetch(`${backendUrl}/api/upc-texts?${params}`);
      const data = await response.json();
      setUpcTexts(data);
    } catch (error) {
      console.error('Error fetching UPC texts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLinkedCases = async (textId) => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/upc-texts/${textId}/linked-cases`);
      const data = await response.json();
      setLinkedCases(data);
    } catch (error) {
      console.error('Error fetching linked cases:', error);
      setLinkedCases([]);
    }
  };

  const handleTextSelect = (text) => {
    setSelectedText(text);
    fetchLinkedCases(text.id);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const filteredTexts = upcTexts.filter(text => {
    const matchesSearch = !searchTerm || 
      text.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      text.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      text.article_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const groupedTexts = filteredTexts.reduce((acc, text) => {
    const section = text.section || 'Other';
    if (!acc[section]) acc[section] = [];
    acc[section].push(text);
    return acc;
  }, {});

  const getDocumentTypeLabel = (docType) => {
    const translations = {
      'rules_of_procedure': t('upcCode.documentTypes.rules_of_procedure'),
      'upc_agreement': t('upcCode.documentTypes.upc_agreement'),
      'statute': t('upcCode.documentTypes.statute'),
      'fees': t('upcCode.documentTypes.fees')
    };
    return translations[docType] || docType;
  };

  const getDocumentTypeIcon = (docType) => {
    const icons = {
      'rules_of_procedure': <Scale className="h-4 w-4" />,
      'upc_agreement': <FileText className="h-4 w-4" />,
      'statute': <Gavel className="h-4 w-4" />,
      'fees': <Star className="h-4 w-4" />
    };
    return icons[docType] || <Book className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-white hover:text-blue-200 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>{t('upcCode.back')}</span>
              </button>
              <div className="h-6 w-px bg-white/30"></div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Book className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-white font-display">
                  {t('upcCode.title')}
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-blue-100">
                {Object.keys(structure).length} {t('upcCode.documents')} • {upcTexts.length} {t('upcCode.articles')}
              </div>
              <button
                onClick={() => setShowTextLoader(true)}
                className="flex items-center space-x-2 px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm"
              >
                <Settings className="h-4 w-4" />
                <span>{t('upcCode.loadOfficialTexts')}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Search and Filters */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t('upcCode.searchPlaceholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('upcCode.documentType')}
                    </label>
                    <select
                      value={selectedDocType}
                      onChange={(e) => setSelectedDocType(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{t('upcCode.allDocuments')}</option>
                      {Object.keys(structure).map(docType => (
                        <option key={docType} value={docType}>
                          {getDocumentTypeLabel(docType)} ({structure[docType].total_count || 0})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Document Structure */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    <span>{t('upcCode.navigation')}</span>
                  </h3>
                  
                  <div className="space-y-2">
                    {Object.entries(groupedTexts).map(([section, texts]) => (
                      <div key={section} className="border border-gray-200 rounded-lg">
                        <button
                          onClick={() => toggleSection(section)}
                          className="w-full p-3 text-left hover:bg-gray-50 flex items-center justify-between transition-colors"
                        >
                          <span className="font-medium text-gray-900">{section}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">({texts.length})</span>
                            {expandedSections[section] ? 
                              <ChevronDown className="h-4 w-4" /> : 
                              <ChevronRight className="h-4 w-4" />
                            }
                          </div>
                        </button>
                        
                        <AnimatePresence>
                          {expandedSections[section] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="p-2 border-t border-gray-200">
                                {texts.map((text) => (
                                  <button
                                    key={text.id}
                                    onClick={() => handleTextSelect(text)}
                                    className={`w-full text-left p-2 rounded hover:bg-blue-50 transition-colors ${
                                      selectedText?.id === text.id ? 'bg-blue-100 border-l-4 border-blue-500' : ''
                                    }`}
                                  >
                                    <div className="flex items-center space-x-2">
                                      {getDocumentTypeIcon(text.document_type)}
                                      <span className="font-medium text-sm">{text.article_number}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 truncate mt-1">{text.title}</p>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Content */}
          <div className="lg:col-span-2">
            {selectedText ? (
              <div className="space-y-6">
                {/* Article Content */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {getDocumentTypeIcon(selectedText.document_type)}
                        <div>
                          <h1 className="text-2xl font-bold text-gray-900">
                            {selectedText.article_number}
                          </h1>
                          <p className="text-lg text-gray-600">{selectedText.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {getDocumentTypeLabel(selectedText.document_type)}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {selectedText.section}
                        </span>
                      </div>
                    </div>
                    
                    <div className="prose max-w-none">
                      <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {selectedText.content}
                      </div>
                    </div>
                    
                    {/* Cross-references */}
                    {selectedText.cross_references && selectedText.cross_references.length > 0 && (
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <button
                          onClick={() => setShowCrosReferences(!showCrosReferences)}
                          className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 font-medium"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>{t('upcCode.crossReferences', { count: selectedText.cross_references.length })}</span>
                          {showCrosReferences ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                        
                        <AnimatePresence>
                          {showCrosReferences && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="mt-3 space-y-2"
                            >
                              {selectedText.cross_references.map((ref, index) => (
                                <div key={index} className="flex items-center space-x-2 text-sm">
                                  <ExternalLink className="h-3 w-3 text-blue-600" />
                                  <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                                    {ref}
                                  </span>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>

                {/* Linked Cases */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <Gavel className="h-5 w-5 text-orange-600" />
                      <span>{t('upcCode.associatedJudgments')}</span>
                      <span className="text-sm font-normal text-gray-500">
                        ({linkedCases.length})
                      </span>
                    </h3>
                    
                    {linkedCases.length === 0 ? (
                      <div className="text-center py-8">
                        <Info className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">
                          {t('upcCode.noAssociatedJudgments')}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {linkedCases.map((linkedCase, index) => (
                          <motion.div
                            key={`${linkedCase.case_id}-${linkedCase.apport_id}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-1">
                                  {linkedCase.case_title}
                                </h4>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{formatDate(linkedCase.date)}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Users className="h-3 w-3" />
                                    <span>{linkedCase.parties.slice(0, 2).join(', ')}</span>
                                    {linkedCase.parties.length > 2 && (
                                      <span className="text-gray-400">+{linkedCase.parties.length - 2}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  // Handle case detail view
                                  console.log('Open case detail:', linkedCase.case_id);
                                }}
                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors flex items-center space-x-1"
                              >
                                <Eye className="h-3 w-3" />
                                <span>{t('upcCode.seeDetails')}</span>
                              </button>
                            </div>
                            
                            {linkedCase.citation && (
                              <div className="bg-orange-50 border-l-4 border-orange-400 p-3 rounded-r-lg">
                                <div className="flex items-start space-x-2">
                                  <Quote className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-sm font-medium text-orange-800 mb-1">
                                      {t('upcCode.citation', { articleNumber: selectedText.article_number })}
                                    </p>
                                    <p className="text-sm text-orange-700 italic">
                                      "{linkedCase.citation}"
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                              {linkedCase.summary}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-12 text-center">
                  <Book className="h-16 w-16 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {t('upcCode.title')}
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    {t('upcCode.subtitle')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* UPC Text Loader Modal */}
      <AnimatePresence>
        {showTextLoader && (
          <UPCTextLoader 
            onClose={() => setShowTextLoader(false)}
            onTextsLoaded={() => {
              setShowTextLoader(false);
              // Refresh the data
              fetchUPCStructure();
              fetchUPCTexts();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default UPCCode;