import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, Settings, Check, Shield } from 'lucide-react';
import axios from 'axios';

const GDPRBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consents, setConsents] = useState({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    functional: false
  });
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    // Check if user has already given consent
    const hasConsent = localStorage.getItem('gdpr_consent');
    if (!hasConsent) {
      setShowBanner(true);
    } else {
      // Load existing consents
      try {
        const savedConsents = JSON.parse(hasConsent);
        setConsents(prevConsents => ({ ...prevConsents, ...savedConsents }));
      } catch (error) {
        console.error('Error parsing saved consents:', error);
        setShowBanner(true);
      }
    }
  }, []);

  const saveConsent = async (consentData) => {
    try {
      await axios.post(`${BACKEND_URL}/api/gdpr/consent`, {
        consent_type: 'analytics',
        consent_given: consentData.analytics,
        purpose: 'Analytics and performance tracking',
        lawful_basis: 'consent'
      });

      await axios.post(`${BACKEND_URL}/api/gdpr/consent`, {
        consent_type: 'marketing',
        consent_given: consentData.marketing,
        purpose: 'Marketing communications and newsletters',
        lawful_basis: 'consent'
      });

      await axios.post(`${BACKEND_URL}/api/gdpr/consent`, {
        consent_type: 'functional',
        consent_given: consentData.functional,
        purpose: 'Enhanced functionality and user experience',
        lawful_basis: 'legitimate_interest'
      });
    } catch (error) {
      console.error('Error saving consent:', error);
    }
  };

  const handleAcceptAll = async () => {
    setLoading(true);
    const newConsents = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true
    };
    
    setConsents(newConsents);
    localStorage.setItem('gdpr_consent', JSON.stringify(newConsents));
    localStorage.setItem('gdpr_consent_date', new Date().toISOString());
    
    await saveConsent(newConsents);
    setShowBanner(false);
    setLoading(false);
  };

  const handleAcceptNecessary = async () => {
    setLoading(true);
    const newConsents = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false
    };
    
    setConsents(newConsents);
    localStorage.setItem('gdpr_consent', JSON.stringify(newConsents));
    localStorage.setItem('gdpr_consent_date', new Date().toISOString());
    
    await saveConsent(newConsents);
    setShowBanner(false);
    setLoading(false);
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    localStorage.setItem('gdpr_consent', JSON.stringify(consents));
    localStorage.setItem('gdpr_consent_date', new Date().toISOString());
    
    await saveConsent(consents);
    setShowBanner(false);
    setShowSettings(false);
    setLoading(false);
  };

  const handleConsentChange = (type, value) => {
    if (type === 'necessary') return; // Cannot be changed
    setConsents(prev => ({ ...prev, [type]: value }));
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-2xl border-t border-gray-200"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {!showSettings ? (
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0 lg:space-x-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Cookie className="h-6 w-6 text-orange-600 mt-1" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Gestion des cookies et de la confidentialité
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Nous utilisons des cookies pour améliorer votre expérience, analyser l'utilisation du site et personnaliser le contenu. 
                      Vous pouvez accepter tous les cookies ou personnaliser vos préférences.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <a 
                        href="/privacy-policy" 
                        className="text-orange-600 hover:text-orange-700 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Politique de confidentialité
                      </a>
                      <span className="text-gray-400">•</span>
                      <a 
                        href="/cookie-policy" 
                        className="text-orange-600 hover:text-orange-700 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Politique des cookies
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full lg:w-auto">
                  <button
                    onClick={() => setShowSettings(true)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Personnaliser</span>
                  </button>
                  <button
                    onClick={handleAcceptNecessary}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Nécessaires uniquement
                  </button>
                  <button
                    onClick={handleAcceptAll}
                    disabled={loading}
                    className="px-6 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    <span>Accepter tout</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-orange-600" />
                    <span>Préférences de confidentialité</span>
                  </h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Cookies nécessaires</h4>
                        <p className="text-sm text-gray-600">Requis pour le fonctionnement du site</p>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-green-600 mr-2">Activé</span>
                        <div className="w-10 h-6 bg-green-500 rounded-full relative">
                          <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 shadow"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Cookies d'analyse</h4>
                        <p className="text-sm text-gray-600">Pour comprendre l'utilisation du site</p>
                      </div>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consents.analytics}
                          onChange={(e) => handleConsentChange('analytics', e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-10 h-6 rounded-full relative transition-colors ${
                          consents.analytics ? 'bg-orange-500' : 'bg-gray-300'
                        }`}>
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow ${
                            consents.analytics ? 'translate-x-4' : 'translate-x-1'
                          }`}></div>
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Cookies marketing</h4>
                        <p className="text-sm text-gray-600">Pour la personnalisation du contenu</p>
                      </div>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consents.marketing}
                          onChange={(e) => handleConsentChange('marketing', e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-10 h-6 rounded-full relative transition-colors ${
                          consents.marketing ? 'bg-orange-500' : 'bg-gray-300'
                        }`}>
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow ${
                            consents.marketing ? 'translate-x-4' : 'translate-x-1'
                          }`}></div>
                        </div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Cookies fonctionnels</h4>
                        <p className="text-sm text-gray-600">Pour des fonctionnalités avancées</p>
                      </div>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consents.functional}
                          onChange={(e) => handleConsentChange('functional', e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-10 h-6 rounded-full relative transition-colors ${
                          consents.functional ? 'bg-orange-500' : 'bg-gray-300'
                        }`}>
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow ${
                            consents.functional ? 'translate-x-4' : 'translate-x-1'
                          }`}></div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSavePreferences}
                    disabled={loading}
                    className="px-6 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    <span>Sauvegarder</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GDPRBanner;