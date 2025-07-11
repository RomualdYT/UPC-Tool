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
  RefreshCw,
  Download,
  Upload,
  Database,
  CheckCircle,
  AlertCircle,
  Clock,
  List,
  Grid,
  Eye,
  ChevronRight,
  ChevronDown,
  Settings,
  FolderOpen,
  FolderClosed
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const UPCTextManager = ({ backendUrl, getAuthHeaders }) => {
  const { t } = useTranslation();
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [editingText, setEditingText] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'hierarchy'
  const [structure, setStructure] = useState({});
  const [expandedNodes, setExpandedNodes] = useState({});

  // Document types
  const documentTypes = [
    { value: 'rules_of_procedure', label: 'Rules of Procedure' },
    { value: 'upc_agreement', label: 'UPC Agreement' },
    { value: 'statute', label: 'Statute' },
    { value: 'fees', label: 'Fees' }
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

  const fetchStructure = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/upc-texts/structure`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setStructure(data);
      }
    } catch (error) {
      console.error('Error fetching structure:', error);
    }
  };

  useEffect(() => {
    fetchTexts();
    fetchStructure();
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
          message: textData.id ? 'Texte mis à jour avec références croisées détectées' : 'Texte créé avec références croisées détectées',
          type: 'success'
        });
        
        // Refresh structure
        fetchStructure();
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
        fetchStructure();
      }
    } catch (error) {
      console.error('Error deleting text:', error);
      setNotification({
        message: 'Erreur lors de la suppression',
        type: 'error'
      });
    }
  };

  const handleImportROP = async (importOptions) => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/import-rop`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(importOptions)
      });

      const result = await response.json();

      if (response.ok) {
        setNotification({
          message: `Import réussi: ${result.imported_count} textes importés, ${result.skipped_count} ignorés`,
          type: 'success'
        });
        
        // Refresh data
        fetchTexts();
        fetchStructure();
      } else {
        throw new Error(result.detail || 'Erreur lors de l\'import');
      }
    } catch (error) {
      console.error('Error importing ROP:', error);
      setNotification({
        message: `Erreur lors de l'import: ${error.message}`,
        type: 'error'
      });
    }
  };

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const TextForm = ({ text, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      document_type: text?.document_type || 'rules_of_procedure',
      part_number: text?.part_number || '',
      part_title: text?.part_title || '',
      chapter_number: text?.chapter_number || '',
      chapter_title: text?.chapter_title || '',
      section_number: text?.section_number || '',
      section_title: text?.section_title || '',
      article_number: text?.article_number || '',
      title: text?.title || '',
      content: text?.content || '',
      language: text?.language || 'EN',
      keywords: text?.keywords || []
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSave({
        ...text,
        ...formData,
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
                {text ? 'Modifier le texte' : 'Nouveau texte'}
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
                  Numéro de partie
                </label>
                <input
                  type="text"
                  value={formData.part_number}
                  onChange={(e) => setFormData({...formData, part_number: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ex: 1, 2, 3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre de partie
                </label>
                <input
                  type="text"
                  value={formData.part_title}
                  onChange={(e) => setFormData({...formData, part_title: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ex: General Provisions"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de chapitre
                </label>
                <input
                  type="text"
                  value={formData.chapter_number}
                  onChange={(e) => setFormData({...formData, chapter_number: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ex: 1, 2, 3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre de chapitre
                </label>
                <input
                  type="text"
                  value={formData.chapter_title}
                  onChange={(e) => setFormData({...formData, chapter_title: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ex: Written Procedure"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de section
                </label>
                <input
                  type="text"
                  value={formData.section_number}
                  onChange={(e) => setFormData({...formData, section_number: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ex: 1, 2, 3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre de section
                </label>
                <input
                  type="text"
                  value={formData.section_title}
                  onChange={(e) => setFormData({...formData, section_title: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ex: Infringement Action"
                />
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
                placeholder="Contenu du texte"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Les références croisées seront automatiquement détectées dans le contenu
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mots-clés
              </label>
              <input
                type="text"
                value={formData.keywords.join(', ')}
                onChange={(e) => setFormData({...formData, keywords: e.target.value.split(',').map(keyword => keyword.trim())})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="mot-clé1, mot-clé2, mot-clé3"
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
                <span>Sauvegarder</span>
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    );
  };

  const ImportModal = ({ onImport, onCancel }) => {
    const [importOptions, setImportOptions] = useState({
      overwrite_existing: false,
      import_preamble: true,
      import_application_rules: true,
      import_content: true
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onImport(importOptions);
      onCancel();
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
          className="bg-white rounded-lg shadow-xl max-w-lg w-full"
        >
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Importer les Rules of Procedure
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Database className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium text-blue-900">Source des données</h3>
              </div>
              <p className="text-sm text-blue-700">
                Les données seront importées depuis le fichier rop.json contenant les Rules of Procedure officielles.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="overwrite_existing"
                  checked={importOptions.overwrite_existing}
                  onChange={(e) => setImportOptions({...importOptions, overwrite_existing: e.target.checked})}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <label htmlFor="overwrite_existing" className="text-sm font-medium text-gray-700">
                  Écraser les données existantes
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="import_preamble"
                  checked={importOptions.import_preamble}
                  onChange={(e) => setImportOptions({...importOptions, import_preamble: e.target.checked})}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <label htmlFor="import_preamble" className="text-sm font-medium text-gray-700">
                  Importer le préambule
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="import_application_rules"
                  checked={importOptions.import_application_rules}
                  onChange={(e) => setImportOptions({...importOptions, import_application_rules: e.target.checked})}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <label htmlFor="import_application_rules" className="text-sm font-medium text-gray-700">
                  Importer les règles d'application et d'interprétation
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="import_content"
                  checked={importOptions.import_content}
                  onChange={(e) => setImportOptions({...importOptions, import_content: e.target.checked})}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <label htmlFor="import_content" className="text-sm font-medium text-gray-700">
                  Importer le contenu structuré (parties, chapitres, sections, règles)
                </label>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <h3 className="font-medium text-yellow-900">Attention</h3>
              </div>
              <p className="text-sm text-yellow-700">
                {importOptions.overwrite_existing 
                  ? "Cette opération supprimera tous les textes existants de type 'Rules of Procedure' et les remplacera par les nouvelles données."
                  : "Les textes existants seront conservés. Seuls les nouveaux textes seront ajoutés."
                }
              </p>
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
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>Importer</span>
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    );
  };

  const HierarchyView = () => {
    const renderNode = (nodeId, node, level = 0) => {
      const isExpanded = expandedNodes[nodeId];
      const hasChildren = node.parts || node.chapters || node.sections || node.rules;

      return (
        <div key={nodeId} className="mb-2">
          <div 
            className={`flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer ${
              level === 0 ? 'bg-blue-50 border border-blue-200' : ''
            }`}
            onClick={() => hasChildren && toggleNode(nodeId)}
            style={{ paddingLeft: `${level * 20 + 8}px` }}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
            
            {level === 0 ? (
              <FolderOpen className="h-4 w-4 text-blue-600" />
            ) : hasChildren ? (
              <FolderClosed className="h-4 w-4 text-gray-600" />
            ) : (
              <FileText className="h-4 w-4 text-gray-500" />
            )}
            
            <span className="text-sm font-medium text-gray-900">
              {node.title || nodeId}
            </span>
            
            {node.count && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {node.count}
              </span>
            )}
          </div>

          {isExpanded && (
            <div className="ml-4">
              {node.parts && Object.entries(node.parts).map(([partId, part]) => 
                renderNode(`${nodeId}-part-${partId}`, part, level + 1)
              )}
              {node.chapters && Object.entries(node.chapters).map(([chapterId, chapter]) => 
                renderNode(`${nodeId}-chapter-${chapterId}`, chapter, level + 1)
              )}
              {node.sections && Object.entries(node.sections).map(([sectionId, section]) => 
                renderNode(`${nodeId}-section-${sectionId}`, section, level + 1)
              )}
              {node.rules && node.rules.map((rule, index) => 
                renderNode(`${nodeId}-rule-${index}`, { title: `${rule.article_number}: ${rule.title}`, count: null }, level + 1)
              )}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Structure hiérarchique</h3>
        <div className="space-y-2">
          {Object.entries(structure).map(([docType, data]) => 
            renderNode(docType, { title: docType, ...data }, 0)
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gestion des textes UPC</h2>
          <p className="text-gray-600">Gérez les textes légaux et importez les Rules of Procedure</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Importer ROP</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau texte</span>
          </button>
        </div>
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
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('hierarchy')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'hierarchy' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>
            
            <button
              onClick={() => {
                fetchTexts();
                fetchStructure();
              }}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'hierarchy' ? (
        <HierarchyView />
      ) : (
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
                        {text.is_editable === false && (
                          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                            Non modifiable
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {text.title}
                      </h3>
                      
                      {(text.part_title || text.chapter_title || text.section_title) && (
                        <div className="text-sm text-gray-600 mb-2">
                          {text.part_title && <span>Part {text.part_number}: {text.part_title}</span>}
                          {text.chapter_title && <span> / Chapter {text.chapter_number}: {text.chapter_title}</span>}
                          {text.section_title && <span> / Section {text.section_number}: {text.section_title}</span>}
                        </div>
                      )}
                      
                      <p className="text-gray-700 text-sm line-clamp-3 mb-3">
                        {text.content}
                      </p>
                      
                      {text.cross_references && text.cross_references.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">Références croisées:</p>
                          <div className="flex flex-wrap gap-1">
                            {text.cross_references.slice(0, 3).map((ref, index) => (
                              <span key={index} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                                {ref}
                              </span>
                            ))}
                            {text.cross_references.length > 3 && (
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                                +{text.cross_references.length - 3} autres
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {text.keywords && text.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1">
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
                      {text.is_editable !== false && (
                        <button
                          onClick={() => handleDeleteText(text.id)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
        
        {showImportModal && (
          <ImportModal
            onImport={handleImportROP}
            onCancel={() => setShowImportModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-sm ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="text-sm">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="absolute top-2 right-2 text-current hover:opacity-70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default UPCTextManager;