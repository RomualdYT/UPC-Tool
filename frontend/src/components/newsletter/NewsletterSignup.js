import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Check, X, Loader } from 'lucide-react';
import axios from 'axios';

const NewsletterSignup = ({ onSuccess, onError, compact = false }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success', 'error', null
  const [message, setMessage] = useState('');

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setStatus(null);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/newsletter/subscribe`, {
        email,
        opt_in: true,
        source: 'website',
        metadata: {
          page: window.location.pathname,
          timestamp: new Date().toISOString()
        }
      });

      setStatus('success');
      setMessage('Inscription réussie ! Merci de votre intérêt.');
      setEmail('');
      
      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (error) {
      setStatus('error');
      const errorMessage = error.response?.data?.detail || 'Une erreur est survenue lors de l\'inscription.';
      setMessage(errorMessage);
      
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || status === 'success'}
              className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading || status === 'success' || !email}
            className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : status === 'success' ? (
              <Check className="h-4 w-4" />
            ) : (
              'S\'abonner'
            )}
          </button>
        </form>
        
        {status && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`text-xs ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}
          >
            {message}
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200"
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <Mail className="h-6 w-6 text-orange-600" />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Restez informé des dernières décisions UPC
          </h3>
          <p className="text-gray-600 mb-4">
            Recevez notre newsletter hebdomadaire avec les nouvelles décisions, analyses et mises à jour importantes.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="Votre adresse email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading || status === 'success'}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading || status === 'success' || !email}
                className="px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Inscription...</span>
                  </>
                ) : status === 'success' ? (
                  <>
                    <Check className="h-5 w-5" />
                    <span>Inscrit !</span>
                  </>
                ) : (
                  <span>S'abonner</span>
                )}
              </button>
            </div>
            
            <p className="text-xs text-gray-500">
              En vous abonnant, vous acceptez de recevoir nos emails et vous pouvez vous désabonner à tout moment.
              Consultez notre <a href="/privacy-policy" className="text-orange-600 hover:text-orange-700">politique de confidentialité</a>.
            </p>
          </form>
          
          {status && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`mt-3 p-3 rounded-lg flex items-center space-x-2 ${
                status === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {status === 'success' ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <X className="h-5 w-5 text-red-600" />
              )}
              <span className="text-sm font-medium">{message}</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default NewsletterSignup;