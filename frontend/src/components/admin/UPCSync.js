import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  RefreshCw, 
  Database, 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  BarChart3,
  X
} from 'lucide-react';

const UPCSync = ({ backendUrl, getAuthHeaders }) => {
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [syncHistory, setSyncHistory] = useState([]);

  const startSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch(`${backendUrl}/api/admin/sync-upc`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_sync: true,
          date_from: null,
          date_to: null
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSyncStatus({
          ...data,
          started_at: new Date().toISOString()
        });
        
        // Simuler le progress (en réalité, cela viendrait du backend)
        simulateProgress(data.sync_id);
        
        setNotification({
          message: 'Synchronisation UPC démarrée',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error starting sync:', error);
      setNotification({
        message: 'Erreur lors du démarrage de la synchronisation',
        type: 'error'
      });
      setSyncing(false);
    }
  };

  const simulateProgress = (syncId) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setSyncStatus(prev => ({
          ...prev,
          status: 'completed',
          progress: 100,
          completed_at: new Date().toISOString(),
          cases_processed: 150,
          cases_added: 25,
          cases_updated: 10
        }));
        setSyncing(false);
        
        // Ajouter à l'historique
        const newHistoryItem = {
          id: syncId,
          date: new Date().toISOString(),
          status: 'completed',
          cases_processed: 150,
          cases_added: 25,
          cases_updated: 10,
          duration: '2m 34s'
        };
        setSyncHistory(prev => [newHistoryItem, ...prev]);
        
        setNotification({
          message: 'Synchronisation terminée avec succès',
          type: 'success'
        });
      } else {
        setSyncStatus(prev => ({
          ...prev,
          progress: Math.round(progress)
        }));
      }
    }, 500);
  };

  const SyncCard = ({ title, value, icon: Icon, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-gray-200 p-6"
    >
      <div className="flex items-center">
        <Icon className={`h-8 w-8 ${color}`} />
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </motion.div>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'in_progress':
        return 'text-blue-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'in_progress':
        return Clock;
      case 'failed':
        return AlertCircle;
      default:
        return Database;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Synchronisation UPC</h2>
          <p className="text-gray-600">Synchroniser les données avec le site officiel UPC</p>
        </div>
        <button
          onClick={startSync}
          disabled={syncing}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Synchronisation...' : 'Démarrer sync'}</span>
        </button>
      </div>

      {/* Current Sync Status */}
      {syncStatus && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Synchronisation en cours</h3>
            <span className={`flex items-center space-x-2 ${getStatusColor(syncStatus.status)}`}>
              {React.createElement(getStatusIcon(syncStatus.status), { className: 'h-5 w-5' })}
              <span className="font-medium">{syncStatus.status}</span>
            </span>
          </div>
          
          {syncStatus.status === 'in_progress' && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Progression</span>
                <span className="text-sm font-medium text-gray-900">{syncStatus.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${syncStatus.progress}%` }}
                />
              </div>
            </div>
          )}
          
          {syncStatus.status === 'completed' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SyncCard
                title="Cas traités"
                value={syncStatus.cases_processed}
                icon={Database}
                color="text-blue-600"
              />
              <SyncCard
                title="Cas ajoutés"
                value={syncStatus.cases_added}
                icon={TrendingUp}
                color="text-green-600"
              />
              <SyncCard
                title="Cas mis à jour"
                value={syncStatus.cases_updated}
                icon={CheckCircle}
                color="text-orange-600"
              />
            </div>
          )}
        </div>
      )}

      {/* Sync History */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Historique des synchronisations</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {syncHistory.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Aucune synchronisation</h4>
              <p className="text-gray-600">Lancez votre première synchronisation pour voir l'historique</p>
            </div>
          ) : (
            syncHistory.map((sync) => (
              <div key={sync.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center space-x-2 ${getStatusColor(sync.status)}`}>
                      {React.createElement(getStatusIcon(sync.status), { className: 'h-5 w-5' })}
                      <span className="font-medium">{sync.status}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(sync.date).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Database className="h-4 w-4" />
                      <span>{sync.cases_processed} traités</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>{sync.cases_added} ajoutés</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4" />
                      <span>{sync.cases_updated} mis à jour</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{sync.duration}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sync Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration de la synchronisation</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Synchronisation automatique</h4>
              <p className="text-sm text-gray-600">Synchroniser automatiquement chaque jour</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Notifications par email</h4>
              <p className="text-sm text-gray-600">Recevoir un email à la fin de chaque synchronisation</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

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

export default UPCSync;