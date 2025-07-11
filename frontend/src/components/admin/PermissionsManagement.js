import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Users, 
  Settings, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X,
  Search,
  Filter,
  Key,
  Lock,
  Unlock,
  AlertTriangle,
  UserCheck,
  Crown
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const PermissionsManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [stats, setStats] = useState({});

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/users`);
      setUsers(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (userData) => {
    const stats = {
      total: userData.length,
      admins: userData.filter(u => u.role === 'admin').length,
      editors: userData.filter(u => u.role === 'editor').length,
      users: userData.filter(u => u.role === 'user').length,
      newsletter_subscribers: userData.filter(u => u.newsletter_opt_in).length
    };
    setStats(stats);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser || !newRole) return;

    try {
      await axios.put(`${BACKEND_URL}/api/admin/users/${selectedUser.id}/role`, {
        role: newRole
      });
      
      // Update local state
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, role: newRole }
          : u
      ));
      
      setShowRoleModal(false);
      setSelectedUser(null);
      setNewRole('');
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    
    try {
      await axios.delete(`${BACKEND_URL}/api/admin/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const openRoleModal = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleInfo = (role) => {
    const roleInfo = {
      admin: {
        label: 'Administrateur',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        icon: Crown,
        description: 'Accès complet à toutes les fonctionnalités'
      },
      editor: {
        label: 'Éditeur',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        icon: Edit3,
        description: 'Peut modifier le contenu et proposer des changements'
      },
      user: {
        label: 'Utilisateur',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        icon: UserCheck,
        description: 'Accès en lecture seule aux données publiques'
      }
    };
    return roleInfo[role] || roleInfo.user;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-dots">
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Shield className="h-7 w-7 text-orange-600" />
            <span>Gestion des Permissions</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Gérez les rôles et permissions des utilisateurs
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Utilisateurs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
            </div>
            <Users className="h-8 w-8 text-gray-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Administrateurs</p>
              <p className="text-2xl font-bold text-red-600">{stats.admins || 0}</p>
            </div>
            <Crown className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Éditeurs</p>
              <p className="text-2xl font-bold text-blue-600">{stats.editors || 0}</p>
            </div>
            <Edit3 className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Utilisateurs</p>
              <p className="text-2xl font-bold text-gray-600">{stats.users || 0}</p>
            </div>
            <UserCheck className="h-8 w-8 text-gray-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Newsletter</p>
              <p className="text-2xl font-bold text-green-600">{stats.newsletter_subscribers || 0}</p>
            </div>
            <UserCheck className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par email ou nom d'utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">Tous les rôles</option>
          <option value="admin">Administrateurs</option>
          <option value="editor">Éditeurs</option>
          <option value="user">Utilisateurs</option>
        </select>
      </div>

      {/* Role Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Description des Rôles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['admin', 'editor', 'user'].map(role => {
            const roleInfo = getRoleInfo(role);
            const RoleIcon = roleInfo.icon;
            return (
              <div key={role} className="flex items-start space-x-3 p-4 rounded-lg border border-gray-200">
                <div className={`p-2 rounded-lg ${roleInfo.bgColor}`}>
                  <RoleIcon className={`h-5 w-5 ${roleInfo.color}`} />
                </div>
                <div>
                  <h3 className={`font-medium ${roleInfo.color}`}>{roleInfo.label}</h3>
                  <p className="text-sm text-gray-600 mt-1">{roleInfo.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Utilisateurs ({filteredUsers.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredUsers.map((userData) => {
            const roleInfo = getRoleInfo(userData.role);
            const RoleIcon = roleInfo.icon;
            return (
              <motion.div
                key={userData.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${roleInfo.bgColor}`}>
                    <RoleIcon className={`h-5 w-5 ${roleInfo.color}`} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-gray-900">{userData.username}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleInfo.bgColor} ${roleInfo.color}`}>
                        {roleInfo.label}
                      </span>
                      {userData.newsletter_opt_in && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Newsletter
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                      <span>{userData.email}</span>
                      {userData.profile && (
                        <span>• {userData.profile}</span>
                      )}
                      <span>• Inscrit le {new Date(userData.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {userData.id !== user?.id && (
                    <>
                      <button
                        onClick={() => openRoleModal(userData)}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                        title="Modifier le rôle"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(userData.id)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                        title="Supprimer l'utilisateur"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  {userData.id === user?.id && (
                    <span className="text-sm text-gray-500 italic">Vous</span>
                  )}
                </div>
              </motion.div>
            );
          })}
          {filteredUsers.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500">
              Aucun utilisateur trouvé.
            </div>
          )}
        </div>
      </div>

      {/* Role Change Modal */}
      <AnimatePresence>
        {showRoleModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Modifier le rôle
                  </h3>
                  <button
                    onClick={() => setShowRoleModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-gray-600 mb-2">
                    Utilisateur: <span className="font-medium">{selectedUser.username}</span>
                  </p>
                  <p className="text-gray-600">
                    Email: <span className="font-medium">{selectedUser.email}</span>
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  {['admin', 'editor', 'user'].map(role => {
                    const roleInfo = getRoleInfo(role);
                    const RoleIcon = roleInfo.icon;
                    return (
                      <label
                        key={role}
                        className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          newRole === role 
                            ? 'border-orange-500 bg-orange-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={role}
                          checked={newRole === role}
                          onChange={(e) => setNewRole(e.target.value)}
                          className="text-orange-600 focus:ring-orange-500"
                        />
                        <div className={`p-1 rounded ${roleInfo.bgColor}`}>
                          <RoleIcon className={`h-4 w-4 ${roleInfo.color}`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{roleInfo.label}</p>
                          <p className="text-sm text-gray-600">{roleInfo.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {newRole === 'admin' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Attention</p>
                        <p className="text-sm text-yellow-700">
                          Ce rôle donne un accès complet à toutes les fonctionnalités d'administration.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowRoleModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleUpdateRole}
                    disabled={!newRole || newRole === selectedUser.role}
                    className="px-6 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    <Check className="h-4 w-4" />
                    <span>Confirmer</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PermissionsManagement;