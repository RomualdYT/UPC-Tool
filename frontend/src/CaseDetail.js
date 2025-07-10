import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  FileText, 
  Calendar, 
  Building2, 
  Users, 
  Globe, 
  Scale, 
  Tag, 
  Download,
  Edit3,
  Save,
  ExternalLink,
  Loader,
  Star,
  MessageSquare,
  BookOpen
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const CaseDetail = ({ caseId, onClose }) => {
  const { t } = useTranslation();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [editingSummary, setEditingSummary] = useState(false);
  const [internalSummary, setInternalSummary] = useState('');

  useEffect(() => {
    if (caseId) {
      fetchCaseDetails();
    }
  }, [caseId]);

  const fetchCaseDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/cases/${caseId}`);
      setCaseData(response.data);
      setInternalSummary(response.data.custom_summary || '');
    } catch (error) {
      console.error('Error fetching case details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPdfDocument = async () => {
    try {
      setPdfLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/cases/${caseId}/pdf`);
      setPdfUrl(response.data.pdf_url);
    } catch (error) {
      console.error('Error fetching PDF:', error);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleSaveSummary = async () => {
    // This will be implemented later with admin functionality
    setEditingSummary(false);
    console.log('Summary to save:', internalSummary);
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd MMMM yyyy');
    } catch {
      return dateString;
    }
  };

  const getCaseTypeBadge = (type) => {
    if (type === 'Order') {
      return 'romulus-badge-primary';
    }
    return 'romulus-badge-secondary';
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div className="bg-white rounded-xl p-8 flex items-center space-x-4">
          <Loader className="h-6 w-6 animate-spin text-orange-500" />
          <span className="text-lg font-medium text-gray-700">Loading case details...</span>
        </div>
      </motion.div>
    );
  }

  if (!caseData) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-orange-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="gradient-primary text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-display">{caseData.reference}</h1>
              <p className="text-orange-100 mt-1">
                {caseData.registry_number} • {formatDate(caseData.date)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Case Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <div className="romulus-card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-orange-600" />
                  <span>Case Information</span>
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <span className={`romulus-badge ${getCaseTypeBadge(caseData.type)}`}>
                      {caseData.type}
                    </span>
                    <span className="text-sm text-gray-500">
                      {caseData.type_of_action}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Date: {formatDate(caseData.date)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Court: {caseData.court_division}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Language: {caseData.language_of_proceedings}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Scale className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Registry: {caseData.registry_number}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parties */}
              {caseData.parties && caseData.parties.length > 0 && (
                <div className="romulus-card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Users className="h-5 w-5 text-orange-600" />
                    <span>Parties</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {caseData.parties.map((party, index) => (
                      <span key={index} className="romulus-badge-secondary">
                        {party}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Official Summary */}
              <div className="romulus-card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Official Summary
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {caseData.summary}
                </p>
              </div>

              {/* Internal Summary */}
              <div className="romulus-card border-orange-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <Edit3 className="h-5 w-5 text-orange-600" />
                    <span>Internal Summary</span>
                  </h3>
                  <button
                    onClick={() => setEditingSummary(!editingSummary)}
                    className="romulus-btn-secondary text-sm py-2 px-4"
                  >
                    {editingSummary ? 'Cancel' : 'Edit'}
                  </button>
                </div>
                
                {editingSummary ? (
                  <div className="space-y-4">
                    <textarea
                      value={internalSummary}
                      onChange={(e) => setInternalSummary(e.target.value)}
                      placeholder="Add internal analysis, notes, or custom summary..."
                      className="w-full h-32 p-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={handleSaveSummary}
                        className="romulus-btn-primary text-sm py-2 px-4 flex items-center space-x-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>Save Summary</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="min-h-[80px] p-4 bg-orange-50 rounded-lg">
                    {internalSummary ? (
                      <p className="text-gray-700 leading-relaxed">{internalSummary}</p>
                    ) : (
                      <p className="text-gray-400 italic">No internal summary added yet. Click Edit to add one.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Administrative Information */}
              {(caseData.admin_summary || (caseData.apports && caseData.apports.length > 0)) && (
                <div className="romulus-card border-blue-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Administrative Information</h3>
                    <div className="flex items-center space-x-2">
                      {caseData.apports && caseData.apports.length > 0 && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full flex items-center space-x-1">
                          <Star className="h-3 w-3" />
                          <span>Important</span>
                        </span>
                      )}
                      {caseData.admin_summary && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full flex items-center space-x-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>Commenté</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Administrative Summary */}
                  {caseData.admin_summary && (
                    <div className="mb-6">
                      <h4 className="text-md font-medium text-gray-900 mb-2 flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        <span>Résumé administratif</span>
                      </h4>
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-gray-700 leading-relaxed">{caseData.admin_summary}</p>
                      </div>
                    </div>
                  )}

                  {/* Apports juridiques */}
                  {caseData.apports && caseData.apports.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center space-x-2">
                        <BookOpen className="h-4 w-4 text-red-600" />
                        <span>Apports juridiques ({caseData.apports.length})</span>
                      </h4>
                      <div className="space-y-3">
                        {caseData.apports.map((apport, index) => (
                          <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium text-red-800">Article {apport.article_number}</span>
                              <span className="text-red-600">-</span>
                              <span className="text-red-700">{apport.regulation}</span>
                            </div>
                            {apport.citation && (
                              <div className="mt-2">
                                <p className="text-sm text-red-600 italic">"{apport.citation}"</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tags */}
              {caseData.tags && caseData.tags.length > 0 && (
                <div className="romulus-card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Tag className="h-5 w-5 text-orange-600" />
                    <span>Tags</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {caseData.tags.map((tag, index) => (
                      <span key={index} className="romulus-badge-secondary">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* PDF Viewer */}
            <div className="lg:col-span-1">
              <div className="romulus-card h-full">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-orange-600" />
                  <span>Document</span>
                </h3>
                
                {!pdfUrl ? (
                  <div className="text-center py-8">
                    <button
                      onClick={fetchPdfDocument}
                      disabled={pdfLoading}
                      className="romulus-btn-primary flex items-center space-x-2 mx-auto"
                    >
                      {pdfLoading ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      <span>{pdfLoading ? 'Loading...' : 'Load Document'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">PDF Document</span>
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-700 flex items-center space-x-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="text-sm">Open in new tab</span>
                      </a>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden">
                      <iframe
                        src={pdfUrl}
                        className="w-full h-96"
                        title="Case Document"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CaseDetail;