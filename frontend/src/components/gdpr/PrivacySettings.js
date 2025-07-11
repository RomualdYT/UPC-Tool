import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Download, Trash2, Edit3, Eye, Check, X, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const PrivacySettings = () => {
  const { user, isAuthenticated } = useAuth();
  const [consents, setConsents] = useState({});
  const [loading, setLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [showDataRequest, setShowDataRequest] = useState(false);
  const [requestType, setRequestType] = useState('access');
  const [requestDescription, setRequestDescription] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    if (isAuthenticated() && user) {
      loadConsents();
    }
  }, [user, isAuthenticated]);

  const loadConsents = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/gdpr/consent`, {
        params: { user_id: user.id, email: user.email }
      });
      setConsents(response.data);
    } catch (error) {
      console.error('Error loading consents:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConsent = async (consentType, consentGiven, purpose) => {
    try {
      await axios.post(`${BACKEND_URL}/api/gdpr/consent`, {
        consent_type: consentType,
        consent_given: consentGiven,
        purpose: purpose,
        lawful_basis: 'consent'
      });
      
      // Update local state
      setConsents(prev => ({
        ...prev,
        [consentType]: {
          ...prev[consentType],
          given: consentGiven,
          date: new Date().toISOString()
        }
      }));
      
      setMessage('Préférences mises à jour avec succès');
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating consent:', error);
      setMessage('Erreur lors de la mise à jour');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const submitDataRequest = async () => {
    if (!user || !requestDescription.trim()) return;
    
    setRequestLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/api/gdpr/request`, {
        email: user.email,
        request_type: requestType,
        description: requestDescription
      });
      
      setMessage('Demande soumise avec succès. Nous vous répondrons dans les plus brefs délais.');
      setMessageType('success');
      setShowDataRequest(false);
      setRequestDescription('');
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      console.error('Error submitting request:', error);
      setMessage('Erreur lors de la soumission de la demande');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setRequestLoading(false);
    }
  };

  const getRequestTypeInfo = (type) => {
    const info = {
      access: {
        title: 'Accès aux données',
        description: 'Demander une copie de toutes les données personnelles que nous détenons sur vous'
      },
      portability: {
        title: 'Portabilité des données',
        description: 'Recevoir vos données dans un format structuré et lisible par machine'
      },
      rectification: {
        title: 'Rectification',
        description: 'Corriger ou mettre à jour vos données personnelles inexactes'
      },
      erasure: {
        title: 'Suppression',
        description: 'Demander la suppression de vos données personnelles (droit à l\'oubli)'
      },
      restriction: {
        title: 'Limitation du traitement',
        description: 'Limiter l\'utilisation de vos données personnelles'
      },
      objection: {
        title: 'Opposition au traitement',
        description: 'Vous opposer au traitement de vos données personnelles'
      }
    };
    return info[type] || info.access;
  };

  if (!isAuthenticated()) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Paramètres de confidentialité</h2>
          <p className="text-gray-600 mb-6">
            Vous devez être connecté pour accéder à vos paramètres de confidentialité.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center space-x-3">
          <Shield className="h-8 w-8 text-orange-600" />
          <span>Paramètres de confidentialité</span>
        </h1>
        <p className="text-gray-600">
          Gérez vos préférences de confidentialité et exercez vos droits RGPD.
        </p>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
            messageType === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {messageType === 'success' ? (
            <Check className="h-5 w-5 text-green-600" />
          ) : (
            <X className="h-5 w-5 text-red-600" />
          )}
          <span>{message}</span>
        </motion.div>
      )}

      <div className="space-y-8">
        {/* Consent Management */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Gestion des consentements
          </h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="loading-dots">
                <div></div>
                <div></div>
                <div></div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { key: 'analytics', title: 'Cookies d\'analyse', description: 'Nous aident à comprendre comment vous utilisez notre site' },
                { key: 'marketing', title: 'Communications marketing', description: 'Newsletter et communications promotionnelles' },
                { key: 'functional', title: 'Cookies fonctionnels', description: 'Améliorent votre expérience utilisateur' }
              ].map(({ key, title, description }) => {
                const consent = consents[key];
                return (
                  <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{title}</h3>
                      <p className="text-sm text-gray-600">{description}</p>
                      {consent && (
                        <p className="text-xs text-gray-500 mt-1">
                          {consent.given ? 'Accepté' : 'Refusé'} le {new Date(consent.date).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consent?.given || false}
                        onChange={(e) => updateConsent(key, e.target.checked, description)}
                        className="sr-only"
                      />
                      <div className={`w-12 h-6 rounded-full relative transition-colors ${
                        consent?.given ? 'bg-orange-500' : 'bg-gray-300'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow ${
                          consent?.given ? 'translate-x-6' : 'translate-x-0.5'
                        }`}></div>
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Data Rights */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Vos droits sur les données
          </h2>
          <p className="text-gray-600 mb-6">
            Conformément au RGPD, vous disposez de plusieurs droits concernant vos données personnelles.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => {
                setRequestType('access');
                setShowDataRequest(true);
              }}
              className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors text-left"
            >
              <Eye className="h-6 w-6 text-orange-600 mb-2" />
              <h3 className="font-medium text-gray-900 mb-1">Accès aux données</h3>
              <p className="text-sm text-gray-600">Consulter vos données</p>
            </button>
            
            <button
              onClick={() => {
                setRequestType('portability');
                setShowDataRequest(true);
              }}
              className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors text-left"
            >
              <Download className="h-6 w-6 text-orange-600 mb-2" />
              <h3 className="font-medium text-gray-900 mb-1">Portabilité</h3>
              <p className="text-sm text-gray-600">Télécharger vos données</p>
            </button>
            
            <button
              onClick={() => {
                setRequestType('rectification');
                setShowDataRequest(true);
              }}
              className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors text-left"
            >
              <Edit3 className="h-6 w-6 text-orange-600 mb-2" />
              <h3 className="font-medium text-gray-900 mb-1">Rectification</h3>
              <p className="text-sm text-gray-600">Corriger vos données</p>
            </button>
            
            <button
              onClick={() => {
                setRequestType('erasure');
                setShowDataRequest(true);
              }}
              className="p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors text-left"
            >
              <Trash2 className="h-6 w-6 text-red-600 mb-2" />
              <h3 className="font-medium text-gray-900 mb-1">Suppression</h3>
              <p className="text-sm text-gray-600">Supprimer vos données</p>
            </button>
            
            <button
              onClick={() => {
                setRequestType('restriction');
                setShowDataRequest(true);
              }}
              className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors text-left"
            >
              <AlertTriangle className="h-6 w-6 text-orange-600 mb-2" />
              <h3 className="font-medium text-gray-900 mb-1">Limitation</h3>
              <p className="text-sm text-gray-600">Limiter le traitement</p>
            </button>
            
            <button
              onClick={() => {
                setRequestType('objection');
                setShowDataRequest(true);
              }}
              className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors text-left"
            >
              <X className="h-6 w-6 text-orange-600 mb-2" />
              <h3 className="font-medium text-gray-900 mb-1">Opposition</h3>
              <p className="text-sm text-gray-600">S'opposer au traitement</p>
            </button>
          </div>
        </div>

        {/* Data Request Modal */}
        {showDataRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {getRequestTypeInfo(requestType).title}
                </h3>
                <button
                  onClick={() => setShowDataRequest(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <p className="text-gray-600 mb-4">
                {getRequestTypeInfo(requestType).description}
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de demande
                </label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="access">Accès aux données</option>
                  <option value="portability">Portabilité des données</option>
                  <option value="rectification">Rectification</option>
                  <option value="erasure">Suppression (droit à l'oubli)</option>
                  <option value="restriction">Limitation du traitement</option>
                  <option value="objection">Opposition au traitement</option>
                </select>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description de votre demande
                </label>
                <textarea
                  value={requestDescription}
                  onChange={(e) => setRequestDescription(e.target.value)}
                  rows={4}
                  placeholder="Veuillez décrire votre demande en détail..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDataRequest(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={submitDataRequest}
                  disabled={requestLoading || !requestDescription.trim()}
                  className="px-6 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {requestLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Soumettre'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PrivacySettings;