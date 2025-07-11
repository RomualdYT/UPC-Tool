import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Users, 
  BookOpen, 
  Layout, 
  Database, 
  FileText, 
  X
} from 'lucide-react';

import UPCTextManager from './UPCTextManager';
import UserManagement from './UserManagement';
import FooterManager from './FooterManager';
import UPCSync from './UPCSync';
import CaseExclusions from './CaseExclusions';

const AdminTabs = ({ onClose, backendUrl, getAuthHeaders }) => {
  const [activeTab, setActiveTab] = useState('users');

  const tabs = [
    { id: 'users', label: 'Utilisateurs', icon: Users, color: 'blue' },
    { id: 'upc-texts', label: 'Code UPC', icon: BookOpen, color: 'green' },
    { id: 'footer', label: 'Footer', icon: Layout, color: 'purple' },
    { id: 'sync', label: 'Synchronisation', icon: Database, color: 'orange' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement backendUrl={backendUrl} getAuthHeaders={getAuthHeaders} />;
      case 'upc-texts':
        return <UPCTextManager backendUrl={backendUrl} getAuthHeaders={getAuthHeaders} />;
      case 'footer':
        return <FooterManager backendUrl={backendUrl} getAuthHeaders={getAuthHeaders} />;
      case 'sync':
        return <UPCSync backendUrl={backendUrl} getAuthHeaders={getAuthHeaders} />;
      default:
        return null;
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
        className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="h-6 w-6" />
              <div>
                <h1 className="text-xl font-semibold">Administration Avancée</h1>
                <p className="text-blue-100 text-sm">Gestion complète du système</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? `border-${tab.color}-500 text-${tab.color}-600`
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {renderTabContent()}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminTabs;