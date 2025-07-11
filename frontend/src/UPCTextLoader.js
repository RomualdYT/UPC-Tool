import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  FileText, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Book,
  Scale,
  Globe
} from 'lucide-react';

const UPCTextLoader = ({ onClose, onTextsLoaded }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState('');

  const loadOfficialTexts = async () => {
    setLoading(true);
    setError(null);
    setProgress('Démarrage du chargement des textes officiels...');

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/sync/upc-texts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setProgress('Chargement en cours... Cela peut prendre quelques minutes.');
      
      // Poll for completion (check every 5 seconds)
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`${backendUrl}/api/upc-texts/structure`);
          if (statusResponse.ok) {
            const structure = await statusResponse.json();
            const totalTexts = Object.values(structure).reduce((sum, doc) => sum + doc.count, 0);
            
            // If we have a significant number of texts, consider it loaded
            if (totalTexts > 20) {
              clearInterval(pollInterval);
              setProgress(`Chargement terminé ! ${totalTexts} textes chargés.`);
              setSuccess(true);
              setLoading(false);
              
              // Notify parent component
              if (onTextsLoaded) {
                onTextsLoaded();
              }
            }
          }
        } catch (pollError) {
          console.error('Polling error:', pollError);
        }
      }, 5000);

      // Clear interval after 5 minutes (timeout)
      setTimeout(() => {
        clearInterval(pollInterval);
        if (loading) {
          setLoading(false);
          setError('Timeout - le chargement peut continuer en arrière-plan');
        }
      }, 300000);

    } catch (err) {
      setLoading(false);
      setError(err.message || 'Erreur lors du chargement des textes');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4"
      >
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 bg-blue-100 rounded-full">
              <Book className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Charger les textes officiels UPC
          </h2>
          
          <p className="text-gray-600 mb-6">
            Télécharger et parser les textes officiels UPC depuis les PDFs officiels :
          </p>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Scale className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">Rules of Procedure</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">UPC Agreement</span>
            </div>
          </div>

          {/* Progress */}
          {loading && (
            <div className="mb-6">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                <span className="text-sm text-blue-600">Chargement en cours...</span>
              </div>
              <p className="text-sm text-gray-600">{progress}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-800 font-medium">
                  Textes chargés avec succès !
                </span>
              </div>
              <p className="text-sm text-green-700 mt-1">{progress}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm text-red-800 font-medium">
                  Erreur de chargement
                </span>
              </div>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Fermer
            </button>
            
            {!success && (
              <button
                onClick={loadOfficialTexts}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Chargement...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Charger les textes</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Warning */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-700">
              <strong>Note :</strong> Ce processus peut prendre quelques minutes. 
              Les textes officiels sont téléchargés et parsés depuis les PDFs officiels UPC.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UPCTextLoader;