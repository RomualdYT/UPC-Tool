import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Search, 
  RefreshCw, 
  Filter,
  X,
  MessageSquare,
  Calendar,
  Building2,
  Users,
  FileText
} from 'lucide-react';

const CaseExclusions = ({ backendUrl, getAuthHeaders }) => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showExcluded, setShowExcluded] = useState(false);
  const [excludingCase, setExcludingCase] = useState(null);
  const [notification, setNotification] = useState(null);

  const fetchCases = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/cases?include_excluded=true`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setCases(data);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
      setNotification({
        message: 'Erreur lors du chargement des cas',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const filteredCases = cases.filter(case_item => {
    const matchesSearch = case_item.registry_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         case_item.order_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         case_item.summary?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesExcluded = showExcluded ? case_item.excluded : !case_item.excluded;
    
    return matchesSearch && matchesExcluded;
  });

  const handleToggleExclusion = async (caseId, currentExcluded, exclusionReason = null) => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/cases/${caseId}/exclude`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          excluded: !currentExcluded,
          exclusion_reason: !currentExcluded ? exclusionReason : null
        })
      });

      if (response.ok) {
        const updatedCase = await response.json();
        setCases(cases.map(c => c.id === caseId ? updatedCase : c));
        setExcludingCase(null);
        setNotification({
          message: `Cas ${!currentExcluded ? 'exclu' : 'inclus'} avec succès`,
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error updating case exclusion:', error);
      setNotification({
        message: 'Erreur lors de la mise à jour',
        type: 'error'
      });
    }
  };

  const ExclusionModal = ({ caseItem, onConfirm, onCancel }) => {
    const [reason, setReason] = useState('');
    const [selectedReason, setSelectedReason] = useState('');

    const predefinedReasons = [
      'Décision sans apport juridique significatif',
      'Procédure purement administrative',
      'Décision technique sans intérêt jurisprudentiel',
      'Doublon ou cas similaire déjà traité',
      'Informations insuffisantes pour analyse',
      'Autre (préciser ci-dessous)'
    ];

    const handleSubmit = (e) => {
      e.preventDefault();
      const finalReason = selectedReason === 'Autre (préciser ci-dessous)' ? reason : selectedReason;
      if (finalReason.trim()) {
        onConfirm(finalReason);
      }
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
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Exclure la décision</span>
              </h2>
              <button
                onClick={onCancel}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Case Info */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-gray-900 mb-2">
                {caseItem.order_reference || caseItem.registry_number}
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(caseItem.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4" />
                  <span>{caseItem.court_division}</span>
                </div>
              </div>
              <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                {caseItem.summary}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motif d'exclusion
                </label>
                <div className="space-y-2">
                  {predefinedReasons.map((predefinedReason, index) => (
                    <label key={index} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value={predefinedReason}
                        checked={selectedReason === predefinedReason}
                        onChange={(e) => setSelectedReason(e.target.value)}
                        className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">{predefinedReason}</span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedReason === 'Autre (préciser ci-dessous)' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Précisez le motif
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Détaillez le motif d'exclusion..."
                    required
                  />
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!selectedReason}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  Exclure
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  const CaseCard = ({ case_item }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg border p-4 hover:shadow-md transition-shadow ${
        case_item.excluded ? 'border-red-200 bg-red-50' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="font-medium text-gray-900">
              {case_item.order_reference || case_item.registry_number}
            </h3>
            {case_item.excluded && (
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                Exclu
              </span>
            )}
          </div>
          
          <div className="text-sm text-gray-600 mb-2">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(case_item.date).toLocaleDateString()}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Building2 className="h-3 w-3" />
                <span>{case_item.court_division}</span>
              </span>
            </div>
          </div>
          
          <p className="text-sm text-gray-700 mb-3 line-clamp-2">
            {case_item.summary}
          </p>
          
          {case_item.excluded && case_item.exclusion_reason && (
            <div className="bg-red-100 border border-red-200 p-3 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <MessageSquare className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Motif d'exclusion</span>
              </div>
              <p className="text-sm text-red-700">{case_item.exclusion_reason}</p>
            </div>
          )}
          
          {case_item.parties && case_item.parties.length > 0 && (
            <div className="flex items-center space-x-1 mt-2">
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
            onClick={() => {
              if (case_item.excluded) {
                handleToggleExclusion(case_item.id, case_item.excluded);
              } else {
                setExcludingCase(case_item);
              }
            }}
            className={`p-2 rounded-lg transition-colors ${
              case_item.excluded 
                ? 'text-green-600 hover:text-green-700 hover:bg-green-50' 
                : 'text-red-600 hover:text-red-700 hover:bg-red-50'
            }`}
            title={case_item.excluded ? 'Inclure' : 'Exclure'}
          >
            {case_item.excluded ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </motion.div>
  );

  const stats = {
    total: cases.length,
    excluded: cases.filter(c => c.excluded).length,
    included: cases.filter(c => !c.excluded).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gestion des exclusions</h2>
          <p className="text-gray-600">Gérer les décisions exclues du site public</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Eye className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Inclus</p>
              <p className="text-2xl font-bold text-gray-900">{stats.included}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <EyeOff className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Exclus</p>
              <p className="text-2xl font-bold text-gray-900">{stats.excluded}</p>
            </div>
          </div>
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Rechercher un cas..."
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowExcluded(!showExcluded)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                showExcluded 
                  ? 'bg-red-50 border-red-200 text-red-700' 
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>{showExcluded ? 'Cas exclus' : 'Cas inclus'}</span>
            </button>
            
            <button
              onClick={fetchCases}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cases List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="loading-dots">
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun cas trouvé</h3>
            <p className="text-gray-600">
              {searchTerm ? `Aucun cas ne correspond à "${searchTerm}"` : 
               showExcluded ? 'Aucun cas exclu' : 'Aucun cas inclus'}
            </p>
          </div>
        ) : (
          filteredCases.map((case_item) => (
            <CaseCard key={case_item.id} case_item={case_item} />
          ))
        )}
      </div>

      {/* Exclusion Modal */}
      {excludingCase && (
        <ExclusionModal
          caseItem={excludingCase}
          onConfirm={(reason) => handleToggleExclusion(excludingCase.id, false, reason)}
          onCancel={() => setExcludingCase(null)}
        />
      )}

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

export default CaseExclusions;