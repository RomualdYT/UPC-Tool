import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  FileText, 
  BookOpen, 
  MessageSquare,
  Star,
  AlertCircle,
  CheckCircle,
  Search,
  Filter
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const AdminPanel = ({ onClose, cases = [], onCaseUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [editingCase, setEditingCase] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, commented, important, none
  const [showAddForm, setShowAddForm] = useState(false);
  const [notification, setNotification] = useState(null);

  const filteredCases = cases.filter(case_item => {
    const matchesSearch = case_item.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         case_item.summary.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' ||
                         (filterType === 'commented' && case_item.admin_summary) ||
                         (filterType === 'important' && case_item.apports && case_item.apports.length > 0) ||
                         (filterType === 'none' && !case_item.admin_summary && (!case_item.apports || case_item.apports.length === 0));
    
    return matchesSearch && matchesFilter;
  });

  const handleSaveCase = async (caseData) => {
    setLoading(true);
    try {
      const response = await axios.put(`${BACKEND_URL}/api/cases/${caseData.id}`, caseData);
      
      // Mettre à jour via le callback parent
      if (onCaseUpdate) {
        onCaseUpdate(response.data);
      }
      
      setEditingCase(null);
      setNotification({
        message: 'Cas mis à jour avec succès',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating case:', error);
      setNotification({
        message: 'Erreur lors de la mise à jour',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddApport = (caseId) => {
    const case_item = cases.find(c => c.id === caseId);
    const newApport = {
      id: Date.now(),
      article_number: '',
      regulation: '',
      citation: ''
    };
    
    const updatedCase = {
      ...case_item,
      apports: [...(case_item.apports || []), newApport]
    };
    
    setEditingCase(updatedCase);
  };

  const handleRemoveApport = (caseId, apportId) => {
    const case_item = cases.find(c => c.id === caseId);
    const updatedCase = {
      ...case_item,
      apports: (case_item.apports || []).filter(a => a.id !== apportId)
    };
    
    setEditingCase(updatedCase);
  };

  const handleUpdateApport = (caseId, apportId, field, value) => {
    const case_item = cases.find(c => c.id === caseId);
    const updatedCase = {
      ...case_item,
      apports: (case_item.apports || []).map(a => 
        a.id === apportId ? { ...a, [field]: value } : a
      )
    };
    
    setEditingCase(updatedCase);
  };

  const CaseCard = ({ case_item }) => {
    const hasApports = case_item.apports && case_item.apports.length > 0;
    const hasSummary = case_item.admin_summary;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-md border border-gray-200 p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{case_item.reference}</h3>
              {hasApports && (
                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full flex items-center space-x-1">
                  <Star className="h-3 w-3" />
                  <span>Important</span>
                </span>
              )}
              {hasSummary && (
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full flex items-center space-x-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>Commenté</span>
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-2">{case_item.type} - {case_item.court_division}</p>
            <p className="text-gray-700 text-sm line-clamp-2">{case_item.summary}</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setEditingCase(case_item)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Modifier"
            >
              <Edit className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Aperçu des apports */}
        {hasApports && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center space-x-1">
              <BookOpen className="h-4 w-4" />
              <span>Apports ({case_item.apports.length})</span>
            </h4>
            <div className="space-y-2">
              {case_item.apports.slice(0, 2).map((apport, index) => (
                <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                  <span className="font-medium">Art. {apport.article_number}</span> - {apport.regulation}
                </div>
              ))}
              {case_item.apports.length > 2 && (
                <div className="text-xs text-gray-500">
                  +{case_item.apports.length - 2} autres apports
                </div>
              )}
            </div>
          </div>
        )}

        {/* Aperçu du résumé */}
        {hasSummary && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center space-x-1">
              <MessageSquare className="h-4 w-4" />
              <span>Résumé</span>
            </h4>
            <p className="text-xs text-gray-700 bg-blue-50 p-2 rounded line-clamp-2">
              {case_item.admin_summary}
            </p>
          </div>
        )}
      </motion.div>
    );
  };

  const EditCaseModal = ({ case_item, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      admin_summary: case_item.admin_summary || '',
      apports: case_item.apports || []
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSave({
        ...case_item,
        ...formData
      });
    };

    const addApport = () => {
      setFormData(prev => ({
        ...prev,
        apports: [...prev.apports, {
          id: Date.now(),
          article_number: '',
          regulation: '',
          citation: ''
        }]
      }));
    };

    const removeApport = (index) => {
      setFormData(prev => ({
        ...prev,
        apports: prev.apports.filter((_, i) => i !== index)
      }));
    };

    const updateApport = (index, field, value) => {
      setFormData(prev => ({
        ...prev,
        apports: prev.apports.map((apport, i) => 
          i === index ? { ...apport, [field]: value } : apport
        )
      }));
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Modifier {case_item.reference}</h2>
              <button
                onClick={onCancel}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Informations du cas */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Informations du cas</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Type:</span> {case_item.type}
                </div>
                <div>
                  <span className="text-gray-600">Division:</span> {case_item.court_division}
                </div>
                <div>
                  <span className="text-gray-600">Date:</span> {new Date(case_item.date).toLocaleDateString()}
                </div>
                <div>
                  <span className="text-gray-600">Langue:</span> {case_item.language_of_proceedings}
                </div>
              </div>
            </div>

            {/* Résumé administratif */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Résumé administratif
              </label>
              <textarea
                value={formData.admin_summary}
                onChange={(e) => setFormData(prev => ({ ...prev, admin_summary: e.target.value }))}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Ajoutez un résumé ou commentaire sur cette décision..."
              />
            </div>

            {/* Apports */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Apports juridiques
                </label>
                <button
                  type="button"
                  onClick={addApport}
                  className="flex items-center space-x-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Ajouter un apport</span>
                </button>
              </div>

              <div className="space-y-4">
                {formData.apports.map((apport, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Apport {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeApport(index)}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Numéro d'article
                        </label>
                        <input
                          type="text"
                          value={apport.article_number}
                          onChange={(e) => updateApport(index, 'article_number', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="ex: 123"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Règlement/texte
                        </label>
                        <input
                          type="text"
                          value={apport.regulation}
                          onChange={(e) => updateApport(index, 'regulation', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="ex: Règlement (UE) 2017/1001"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Citation (passage)
                      </label>
                      <textarea
                        value={apport.citation}
                        onChange={(e) => updateApport(index, 'citation', e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Citez le passage pertinent..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Enregistrer</span>
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="h-6 w-6" />
              <h1 className="text-xl font-semibold">Administration UPC</h1>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-80px)]">
          {/* Sidebar */}
          <div className="w-80 border-r border-gray-200 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Rechercher un cas..."
                  />
                </div>
              </div>

              {/* Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filtrer par</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">Tous les cas</option>
                  <option value="commented">Cas commentés</option>
                  <option value="important">Cas importants</option>
                  <option value="none">Sans commentaires</option>
                </select>
              </div>

              {/* Stats */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Statistiques</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-medium">{cases.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Commentés:</span>
                    <span className="font-medium">{cases.filter(c => c.admin_summary).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Importants:</span>
                    <span className="font-medium">{cases.filter(c => c.apports && c.apports.length > 0).length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="loading-dots">
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredCases.map((case_item) => (
                  <CaseCard key={case_item.id} case_item={case_item} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Edit Modal */}
        <AnimatePresence>
          {editingCase && (
            <EditCaseModal
              case_item={editingCase}
              onSave={handleSaveCase}
              onCancel={() => setEditingCase(null)}
            />
          )}
        </AnimatePresence>

        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
                notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
              }`}
            >
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default AdminPanel; 