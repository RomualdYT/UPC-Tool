import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  RefreshCw, 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Download,
  Globe,
  Info
} from 'lucide-react';
import axios from 'axios';
import { useData } from './contexts/DataContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const UPCSync = ({ onSync, syncing: externalSyncing }) => {
  const { t } = useTranslation();
  const { allCases, stats, fetchAllCases } = useData();
  
  const [syncStatus, setSyncStatus] = useState({
    total_cases: 0,
    last_sync: null,
    database_status: 'disconnected'
  });
  const [syncResult, setSyncResult] = useState(null);
  const [backendStats, setBackendStats] = useState(null);

  useEffect(() => {
    fetchSyncStatus();
    fetchBackendStats();
  }, []);

  // Utiliser les données du contexte quand elles sont disponibles
  const displayStats = stats || backendStats;
  const totalCases = allCases.length || syncStatus.total_cases;

  const fetchSyncStatus = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/sync/status`);
      setSyncStatus(response.data);
    } catch (error) {
      console.error('Error fetching sync status:', error);
    }
  };

  const fetchBackendStats = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/stats`);
      setBackendStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSync = async () => {
    setSyncResult(null);
    
    try {
      if (onSync) {
        const result = await onSync();
        if (result.success) {
          setSyncResult({
            success: true,
            message: result.message || 'Synchronisation UPC démarrée'
          });
        } else {
          setSyncResult({
            success: false,
            message: result.error || 'Erreur de synchronisation'
          });
        }
      }
      
      // Refresh status after sync
      setTimeout(() => {
        fetchSyncStatus();
        fetchBackendStats();
      }, 3000);
      
    } catch (error) {
      setSyncResult({
        success: false,
        message: error.response?.data?.detail || 'Sync failed'
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card max-w-4xl mx-auto mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-legal-900 flex items-center space-x-2">
          <Database className="h-5 w-5 text-primary-600" />
          <span>UPC Data Synchronization</span>
        </h3>
        
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            syncStatus.database_status === 'connected' ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-sm text-legal-600">
            {syncStatus.database_status === 'connected' ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Status Cards */}
        <div className="space-y-4">
          <div className="bg-primary-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary-600 font-medium">Total Cases</p>
                <p className="text-2xl font-bold text-primary-900">{syncStatus.total_cases}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-primary-600" />
            </div>
          </div>
          
          <div className="bg-secondary-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 font-medium">Last Sync</p>
                <p className="text-sm text-secondary-900">
                  {syncStatus.last_sync ? new Date(syncStatus.last_sync).toLocaleDateString() : 'Never'}
                </p>
              </div>
              <Clock className="h-6 w-6 text-secondary-600" />
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="space-y-4">
            <div className="bg-accent-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-accent-600 font-medium">Database Stats</p>
                <Info className="h-5 w-5 text-accent-600" />
              </div>
              <div className="space-y-2 text-sm text-accent-900">
                <div className="flex justify-between">
                  <span>Case Types:</span>
                  <span>{stats.case_types.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Court Divisions:</span>
                  <span>{stats.court_divisions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Languages:</span>
                  <span>{stats.languages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Recent Cases:</span>
                  <span>{stats.recent_cases}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sync Controls */}
      <div className="border-t pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <Globe className="h-5 w-5 text-legal-500" />
            <div>
              <p className="text-sm font-medium text-legal-900">Sync with UPC Website</p>
              <p className="text-xs text-legal-600">
                Fetch all latest decisions from unified-patent-court.org
              </p>
            </div>
          </div>
          
          <button
            onClick={handleSync}
            disabled={issyncing}
            className="romulus-btn-primary flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${issyncing ? 'animate-spin' : ''}`} />
            <span>{issyncing ? 'Syncing all pages...' : 'Sync All Data'}</span>
          </button>
        </div>
      </div>

      {/* Sync Result */}
      {syncResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-4 p-4 rounded-lg border ${
            syncResult.success 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {syncResult.success ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">{syncResult.message}</span>
          </div>
        </motion.div>
      )}

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
      >
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">About UPC Data Synchronization</p>
            <p>
              This system automatically retrieves the latest decisions and orders from the official 
              Unified Patent Court website. Data is parsed and stored locally for faster search and analysis.
              Regular synchronization ensures you have access to the most recent legal decisions.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UPCSync;