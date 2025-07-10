import React, { useState, useCallback } from 'react';
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
  Filter,
  RefreshCw,
  Users,
  Building2,
  Calendar,
  Globe
} from 'lucide-react';
import { useData } from './contexts/DataContext';

const AdminPanel = ({ onClose, onCaseUpdate }) => {
  const {
    allCases,
    loading,
    updateCase,
    setNotification
  } = useData();

  const [selectedCase, setSelectedCase] = useState(null);
  const [editingCase, setEditingCase] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, commented, important, none
  const [localLoading, setLocalLoading] = useState(false);

  // Filtrer les cas selon les critères
  const filteredCases = allCases.filter(case_item => {
    const matchesSearch = case_item.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         case_item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (case_item.court_division && case_item.court_division.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterType === 'all' ||
                         (filterType === 'commented' && case_item.admin_summary) ||
                         (filterType === 'important' && case_item.apports && case_item.apports.length > 0) ||
                         (filterType === 'none' && !case_item.admin_summary && (!case_item.apports || case_item.apports.length === 0));
    
    return matchesSearch && matchesFilter;
  });

  // Statistiques administratives
  const adminStats = {
    total: allCases.length,
    commented: allCases.filter(c => c.admin_summary).length,
    important: allCases.filter(c => c.apports && c.apports.length > 0).length,
    none: allCases.filter(c => !c.admin_summary && (!c.apports || c.apports.length === 0)).length,
    completion: allCases.length > 0 ? Math.round(((allCases.filter(c => c.admin_summary || (c.apports && c.apports.length > 0)).length) / allCases.length) * 100) : 0
  };

  const handleSaveCase = useCallback(async (caseData) => {
    setLocalLoading(true);
    try {
      const updateData = {
        admin_summary: caseData.admin_summary || null,
        apports: caseData.apports || []
      };

      const result = await updateCase(caseData.id, updateData);
      
      if (result.success) {
        setEditingCase(null);
        setNotification({
          message: 'Cas mis à jour avec succès',
          type: 'success',
          duration: 4000
        });
        
        // Callback pour informer le parent si nécessaire
        if (onCaseUpdate) {
          onCaseUpdate(result.data);
        }
      } else {
        setNotification({
          message: `Erreur lors de la mise à jour: ${result.error}`,
          type: 'error',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error updating case:', error);
      setNotification({
        message: 'Erreur lors de la mise à jour',
        type: 'error',
        duration: 5000
      });
    } finally {
      setLocalLoading(false);
    }
  }, [updateCase, setNotification, onCaseUpdate]);

  const CaseCard = ({ case_item }) => {
    const hasApports = case_item.apports && case_item.apports.length > 0;
    const hasSummary = case_item.admin_summary;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer"
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
              {!hasApports && !hasSummary && (
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                  À traiter
                </span>
              )}
            </div>
            
            {/* Informations de base */}
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(case_item.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Building2 className="h-3 w-3" />
                <span>{case_item.court_division}</span>
              </div>
              <div className="flex items-center space-x-1">
                <FileText className="h-3 w-3" />
                <span>{case_item.type}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Globe className="h-3 w-3" />
                <span>{case_item.language_of_proceedings}</span>
              </div>
            </div>
            
            <p className="text-gray-700 text-sm line-clamp-3 mb-3">{case_item.summary}</p>
            
            {/* Parties */}
            {case_item.parties && case_item.parties.length > 0 && (
              <div className="flex items-center space-x-1 mb-3">
                <Users className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-600">
                  {case_item.parties.slice(0, 2).join(', ')}
                  {case_item.parties.length > 2 && ` +${case_item.parties.length - 2} autres`}
                </span>
              </div>
            )}
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
                <div key={index} className="text-xs bg-red-50 p-2 rounded border border-red-200">
                  <span className="font-medium text-red-800">Art. {apport.article_number}</span>
                  <span className="text-red-700"> - {apport.regulation}</span>
                  {apport.citation && (
                    <p className="text-red-600 mt-1 italic line-clamp-1">"{apport.citation}"</p>
                  )}
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
              <span>Résumé administratif</span>
            </h4>
            <p className="text-xs text-gray-700 bg-blue-50 p-2 rounded border border-blue-200 line-clamp-3">
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
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Modifier {case_item.reference}</h2>
              <button
                onClick={onCancel}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Informations du cas */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Informations du cas</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 font-medium">Type:</span> 
                  <span className="ml-2">{case_item.type}</span>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Division:</span> 
                  <span className="ml-2">{case_item.court_division}</span>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Date:</span> 
                  <span className="ml-2">{new Date(case_item.date).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Langue:</span> 
                  <span className="ml-2">{case_item.language_of_proceedings}</span>
                </div>
              </div>
              
              {/* Résumé original */}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Résumé original</h4>
                <p className="text-sm text-gray-600 bg-white p-3 rounded border line-clamp-4">
                  {case_item.summary}
                </p>
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
              <p className="text-xs text-gray-500 mt-1">
                Utilisez ce champ pour ajouter votre propre analyse ou commentaires sur cette décision.
              </p>
            </div>

            {/* Apports */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Apports juridiques
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Identifiez les éléments juridiques importants de cette décision.
                  </p>
                </div>
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
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        Citation (passage pertinent)
                      </label>
                      <textarea
                        value={apport.citation}
                        onChange={(e) => updateApport(index, 'citation', e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Citez le passage pertinent de cette décision..."
                      />
                    </div>
                  </div>
                ))}
                
                {formData.apports.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun apport juridique ajouté</p>
                    <p className="text-sm">Cliquez sur "Ajouter un apport" pour commencer</p>
                  </div>
                )}
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
                disabled={localLoading}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                {localLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{localLoading ? 'Enregistrement...' : 'Enregistrer'}</span>
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
              <div>
                <h1 className="text-xl font-semibold">Administration UPC</h1>
                <p className="text-orange-100 text-sm">Gestion des commentaires et apports juridiques</p>
              </div>
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
        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-80 border-r border-gray-200 p-6 overflow-y-auto bg-gray-50">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Filtrer par statut</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">Tous les cas ({allCases.length})</option>
                  <option value="commented">Cas commentés ({adminStats.commented})</option>
                  <option value="important">Cas importants ({adminStats.important})</option>
                  <option value="none">À traiter ({adminStats.none})</option>
                </select>
              </div>

              {/* Stats détaillées */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3">Statistiques détaillées</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total des cas:</span>
                    <span className="font-medium">{adminStats.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center space-x-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>Commentés:</span>
                    </span>
                    <span className="font-medium text-blue-600">{adminStats.commented}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center space-x-1">
                      <Star className="h-3 w-3" />
                      <span>Importants:</span>
                    </span>
                    <span className="font-medium text-red-600">{adminStats.important}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">À traiter:</span>
                    <span className="font-medium text-gray-600">{adminStats.none}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Taux de complétion:</span>
                      <span className="font-medium text-green-600">{adminStats.completion}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${adminStats.completion}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Légende */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Légende</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full flex items-center space-x-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>Commenté</span>
                    </span>
                    <span className="text-gray-600">Résumé admin ajouté</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full flex items-center space-x-1">
                      <Star className="h-3 w-3" />
                      <span>Important</span>
                    </span>
                    <span className="text-gray-600">Apports juridiques</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                      À traiter
                    </span>
                    <span className="text-gray-600">Aucune annotation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="loading-dots mb-4">
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                  <p className="text-gray-600">Chargement des cas...</p>
                </div>
              </div>
            ) : (
              <>
                {/* En-tête avec compteur */}
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {filterType === 'all' && 'Tous les cas'}
                    {filterType === 'commented' && 'Cas commentés'}
                    {filterType === 'important' && 'Cas importants'}
                    {filterType === 'none' && 'Cas à traiter'}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {filteredCases.length} cas {searchTerm && `trouvés pour "${searchTerm}"`}
                  </p>
                </div>

                {/* Grille des cas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredCases.map((case_item) => (
                    <CaseCard key={case_item.id} case_item={case_item} />
                  ))}
                </div>

                {/* Message si aucun résultat */}
                {filteredCases.length === 0 && (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun cas trouvé</h3>
                    <p className="text-gray-600">
                      {searchTerm 
                        ? `Aucun cas ne correspond à "${searchTerm}"`
                        : "Aucun cas ne correspond aux critères sélectionnés"
                      }
                    </p>
                  </div>
                )}
              </>
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
      </motion.div>
    </motion.div>
  );
};

export default AdminPanel;