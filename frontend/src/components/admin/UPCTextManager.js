import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Search,
  BookOpen,
  FileText,
  Filter,
  RefreshCw
} from 'lucide-react';

const UPCTextManager = ({ backendUrl, getAuthHeaders }) => {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [editingText, setEditingText] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notification, setNotification] = useState(null);

  // Document types
  const documentTypes = [
    { value: 'rules_of_procedure', label: 'Règles de procédure' },
    { value: 'upc_agreement', label: 'Accord UPC' },
    { value: 'statute', label: 'Statut' },
    { value: 'fees', label: 'Règlement des honoraires' }
  ];

  const fetchTexts = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/upc-texts`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setTexts(data);
      }
    } catch (error) {
      console.error('Error fetching texts:', error);
      setNotification({
        message: 'Erreur lors du chargement des textes',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTexts();
  }, []);

  const filteredTexts = texts.filter(text => {
    const matchesSearch = text.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         text.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         text.article_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || text.document_type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const handleSaveText = async (textData) => {
    try {
      const url = textData.id 
        ? `${backendUrl}/api/admin/upc-texts/${textData.id}`
        : `${backendUrl}/api/admin/upc-texts`;
      
      const method = textData.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(textData)
      });

      if (response.ok) {
        const updatedText = await response.json();
        
        if (textData.id) {
          setTexts(texts.map(t => t.id === textData.id ? updatedText : t));
        } else {
          setTexts([...texts, updatedText]);
        }
        
        setEditingText(null);
        setShowCreateModal(false);
        setNotification({
          message: textData.id ? 'Texte mis à jour' : 'Texte créé',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error saving text:', error);
      setNotification({
        message: 'Erreur lors de la sauvegarde',
        type: 'error'
      });
    }
  };

  const handleDeleteText = async (textId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce texte ?')) {
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/admin/upc-texts/${textId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setTexts(texts.filter(t => t.id !== textId));
        setNotification({
          message: 'Texte supprimé',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error deleting text:', error);
      setNotification({
        message: 'Erreur lors de la suppression',
        type: 'error'
      });
    }
  };

  const TextForm = ({ text, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      document_type: text?.document_type || 'rules_of_procedure',
      section: text?.section || '',
      article_number: text?.article_number || '',
      title: text?.title || '',
      content: text?.content || '',
      language: text?.language || 'EN',
      cross_references: text?.cross_references || [],
      keywords: text?.keywords || []
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSave({
        ...text,
        ...formData,
        cross_references: formData.cross_references.filter(ref => ref.trim()),
        keywords: formData.keywords.filter(keyword => keyword.trim())
      });
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
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {text ? 'Modifier le texte' : 'Nouveau texte UPC'}
              </h2>
              <button
                onClick={onCancel}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de document
                </label>
                <select
                  value={formData.document_type}
                  onChange={(e) => setFormData({...formData, document_type: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {documentTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section
                </label>
                <input
                  type="text"
                  value={formData.section}
                  onChange={(e) => setFormData({...formData, section: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ex: Part I - General Provisions"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro d'article
                </label>
                <input
                  type="text"
                  value={formData.article_number}
                  onChange={(e) => setFormData({...formData, article_number: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ex: Rule 1, Article 32"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Langue
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({...formData, language: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="EN">English</option>
                  <option value="FR">Français</option>
                  <option value="DE">Deutsch</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Titre du texte"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contenu
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                rows={8}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contenu du texte juridique"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Références croisées (séparées par des virgules)
              </label>
              <input
                type="text"
                value={formData.cross_references.join(', ')}
                onChange={(e) => setFormData({...formData, cross_references: e.target.value.split(',').map(ref => ref.trim())})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Rule 2, Article 1 UPCA"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mots-clés (séparés par des virgules)
              </label>
              <input
                type="text"
                value={formData.keywords.join(', ')}
                onChange={(e) => setFormData({...formData, keywords: e.target.value.split(',').map(keyword => keyword.trim())})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="procédure, compétence, brevet"
              />
            </div>

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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Code UPC/JUB</h2>
          <p className="text-gray-600">Gestion des textes juridiques et règlements</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nouveau texte</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Rechercher un texte..."
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les types</option>
              {documentTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            
            <button
              onClick={fetchTexts}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      {/* Texts List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="loading-dots">
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
        ) : filteredTexts.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun texte trouvé</h3>
            <p className="text-gray-600">
              {searchTerm ? `Aucun texte ne correspond à "${searchTerm}"` : 'Commencez par ajouter un texte'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTexts.map((text) => (
              <div key={text.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {documentTypes.find(t => t.value === text.document_type)?.label}
                      </span>
                      <span className="text-sm text-gray-600">
                        {text.article_number}
                      </span>
                      <span className="text-sm text-gray-600">
                        {text.language}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {text.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-3">
                      {text.section}
                    </p>
                    
                    <p className="text-gray-700 text-sm line-clamp-3">
                      {text.content}
                    </p>
                    
                    {text.keywords && text.keywords.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {text.keywords.slice(0, 5).map((keyword, index) => (
                          <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                            {keyword}
                          </span>
                        ))}
                        {text.keywords.length > 5 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                            +{text.keywords.length - 5} autres
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setEditingText(text)}
                      className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteText(text.id)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(editingText || showCreateModal) && (
          <TextForm
            text={editingText}
            onSave={handleSaveText}
            onCancel={() => {
              setEditingText(null);
              setShowCreateModal(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {notification.message}
          <button
            onClick={() => setNotification(null)}
            className="ml-4 text-current hover:opacity-70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default UPCTextManager;