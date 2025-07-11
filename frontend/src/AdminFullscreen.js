import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Users, 
  BookOpen, 
  Layout, 
  Database, 
  FileText,
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Star,
  MessageSquare,
  Calendar,
  Activity,
  Shield,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useData } from './contexts/DataContext';
import { useTranslation } from 'react-i18next';
import UserManagement from './components/admin/UserManagement';
import UPCTextManager from './components/admin/UPCTextManager';
import FooterManager from './components/admin/FooterManager';
import UPCSync from './components/admin/UPCSync';
import CaseExclusions from './components/admin/CaseExclusions';
import AdminCasesManager from './components/admin/AdminCasesManager';

const AdminFullscreen = ({ onClose, onCaseUpdate }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const { allCases, loading } = useData();

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  // Calculer les statistiques
  const adminStats = {
    total: allCases.length,
    commented: allCases.filter(c => c.admin_summary).length,
    important: allCases.filter(c => c.apports && c.apports.length > 0).length,
    excluded: allCases.filter(c => c.excluded).length,
    none: allCases.filter(c => !c.admin_summary && (!c.apports || c.apports.length === 0)).length,
    completion: allCases.length > 0 ? Math.round(((allCases.filter(c => c.admin_summary || (c.apports && c.apports.length > 0)).length) / allCases.length) * 100) : 0
  };

  const tabs = [
    { id: 'dashboard', label: t('admin.dashboard'), icon: BarChart3, color: 'purple' },
    { id: 'users', label: t('admin.users'), icon: Users, color: 'blue' },
    { id: 'cases', label: t('admin.cases'), icon: MessageSquare, color: 'orange' },
    { id: 'exclusions', label: t('admin.exclusions'), icon: FileText, color: 'red' },
    { id: 'upc-texts', label: t('navigation.upcCode'), icon: BookOpen, color: 'green' },
    { id: 'sync', label: t('admin.sync'), icon: Database, color: 'indigo' },
    { id: 'footer', label: t('admin.footer'), icon: Layout, color: 'pink' }
  ];

  const DashboardContent = () => (
    <div className="space-y-6">
      {/* Titre */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('admin.dashboard')}</h1>
        <p className="text-gray-600">{t('admin.overview')}</p>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-lg p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('admin.totalCases')}</p>
              <p className="text-3xl font-bold text-gray-900">{adminStats.total}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-500">
              <Activity className="h-4 w-4 mr-1" />
              <span>{t('admin.activeSystem')}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-lg p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('admin.commentedCases')}</p>
              <p className="text-3xl font-bold text-blue-600">{adminStats.commented}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>{t('admin.summariesAdded')}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-lg p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('admin.importantCases')}</p>
              <p className="text-3xl font-bold text-red-600">{adminStats.important}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <Star className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-red-600">
              <Shield className="h-4 w-4 mr-1" />
              <span>{t('admin.legalContributions')}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-lg p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('admin.completionRate')}</p>
              <p className="text-3xl font-bold text-green-600">{adminStats.completion}%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${adminStats.completion}%` }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Graphiques et détails */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition des cas */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow-lg p-6 border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.caseDistribution')}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">{t('admin.commented')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">{adminStats.commented}</span>
                <span className="text-xs text-gray-500">({adminStats.total > 0 ? Math.round((adminStats.commented / adminStats.total) * 100) : 0}%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">{t('admin.important')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">{adminStats.important}</span>
                <span className="text-xs text-gray-500">({adminStats.total > 0 ? Math.round((adminStats.important / adminStats.total) * 100) : 0}%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-600">{t('admin.toProcess')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">{adminStats.none}</span>
                <span className="text-xs text-gray-500">({adminStats.total > 0 ? Math.round((adminStats.none / adminStats.total) * 100) : 0}%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">{t('admin.excluded')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">{adminStats.excluded}</span>
                <span className="text-xs text-gray-500">({adminStats.total > 0 ? Math.round((adminStats.excluded / adminStats.total) * 100) : 0}%)</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Actions rapides */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg shadow-lg p-6 border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.quickActions')}</h3>
          <div className="space-y-3">
            <button
              onClick={() => setActiveTab('cases')}
              className="w-full flex items-center space-x-3 p-3 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors"
            >
              <MessageSquare className="h-5 w-5 text-orange-600" />
              <div className="flex-1 text-left">
                <p className="font-medium text-orange-900">{t('admin.manageComments')}</p>
                <p className="text-sm text-orange-600">{t('admin.addSummaries')}</p>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className="w-full flex items-center space-x-3 p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
            >
              <Users className="h-5 w-5 text-blue-600" />
              <div className="flex-1 text-left">
                <p className="font-medium text-blue-900">{t('admin.manageUsers')}</p>
                <p className="text-sm text-blue-600">{t('admin.addModifyDelete')}</p>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('sync')}
              className="w-full flex items-center space-x-3 p-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
            >
              <Database className="h-5 w-5 text-indigo-600" />
              <div className="flex-1 text-left">
                <p className="font-medium text-indigo-900">{t('admin.syncData')}</p>
                <p className="text-sm text-indigo-600">{t('admin.updateFromUPC')}</p>
              </div>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Statut du système */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-lg shadow-lg p-6 border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.systemStatus')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{t('admin.apiBackend')}</p>
              <p className="text-sm text-green-600">{t('admin.operational')}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{t('admin.database')}</p>
              <p className="text-sm text-green-600">{t('admin.connected')}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-full">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{t('admin.lastSync')}</p>
              <p className="text-sm text-yellow-600">{t('admin.hoursAgo')}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent />;
      case 'users':
        return <UserManagement backendUrl={backendUrl} getAuthHeaders={getAuthHeaders} />;
      case 'cases':
        return <AdminCasesManager onCaseUpdate={onCaseUpdate} />;
      case 'exclusions':
        return <CaseExclusions backendUrl={backendUrl} getAuthHeaders={getAuthHeaders} />;
      case 'upc-texts':
        return <UPCTextManager backendUrl={backendUrl} getAuthHeaders={getAuthHeaders} />;
      case 'sync':
        return <UPCSync backendUrl={backendUrl} getAuthHeaders={getAuthHeaders} />;
      case 'footer':
        return <FooterManager backendUrl={backendUrl} getAuthHeaders={getAuthHeaders} />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 to-purple-800 shadow-lg sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="flex items-center space-x-2 text-white hover:text-purple-200 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">{t('admin.return')}</span>
              </button>
              <div className="h-6 w-px bg-purple-400"></div>
              <div className="flex items-center space-x-3">
                <Settings className="h-6 w-6 text-white" />
                <div>
                  <h1 className="text-xl font-semibold text-white">{t('admin.upcAdministration')}</h1>
                  <p className="text-purple-200 text-sm">{t('admin.completeSystemManagement')}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-purple-200">{t('admin.administrator')}</p>
                <p className="text-xs text-purple-300">{t('admin.fullAccess')}</p>
              </div>
              <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AdminFullscreen;