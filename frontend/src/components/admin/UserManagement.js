import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Shield, 
  Star, 
  UserCircle, 
  Edit, 
  Trash2, 
  Search,
  RefreshCw,
  Plus,
  Settings,
  Crown,
  X
} from 'lucide-react';

const UserManagement = ({ backendUrl, getAuthHeaders }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [notification, setNotification] = useState(null);

  const roles = [
    { value: 'user', label: 'Utilisateur', icon: UserCircle, color: 'gray' },
    { value: 'editor', label: 'Rédacteur', icon: Star, color: 'blue' },
    { value: 'admin', label: 'Administrateur', icon: Shield, color: 'red' }
  ];

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/users`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setNotification({
        message: 'Erreur lors du chargement des utilisateurs',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ));
        setNotification({
          message: 'Rôle mis à jour avec succès',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error updating role:', error);
      setNotification({
        message: 'Erreur lors de la mise à jour du rôle',
        type: 'error'
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId));
        setNotification({
          message: 'Utilisateur supprimé avec succès',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setNotification({
        message: 'Erreur lors de la suppression',
        type: 'error'
      });
    }
  };

  const getRoleInfo = (role) => {
    return roles.find(r => r.value === role) || roles[0];
  };

  const UserCard = ({ user }) => {
    const roleInfo = getRoleInfo(user.role);
    const Icon = roleInfo.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              roleInfo.color === 'red' ? 'bg-red-100 text-red-600' :
              roleInfo.color === 'blue' ? 'bg-blue-100 text-blue-600' :
              'bg-gray-100 text-gray-600'
            }`}>
              <Icon className="h-6 w-6" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-medium text-gray-900">{user.username}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  roleInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                  roleInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {roleInfo.label}
                </span>
              </div>
              
              <p className="text-sm text-gray-600">{user.email}</p>
              
              <div className="mt-2 text-xs text-gray-500">
                {user.profile && (
                  <span className="mr-3">Profil: {user.profile}</span>
                )}
                <span>Créé: {new Date(user.created_at).toLocaleDateString()}</span>
              </div>
              
              {user.newsletter_opt_in && (
                <div className="mt-2 flex items-center space-x-1 text-xs text-green-600">
                  <span>✓ Inscrit à la newsletter</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={user.role}
              onChange={(e) => handleUpdateRole(user.id, e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {roles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => handleDeleteUser(user.id)}
              className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  // Statistics
  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    editors: users.filter(u => u.role === 'editor').length,
    users: users.filter(u => u.role === 'user').length,
    newsletter: users.filter(u => u.newsletter_opt_in).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gestion des utilisateurs</h2>
          <p className="text-gray-600">Gérer les comptes utilisateurs et leurs permissions</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-gray-900">{stats.admins}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Star className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Rédacteurs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.editors}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <UserCircle className="h-8 w-8 text-gray-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Utilisateurs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.users}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Crown className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Newsletter</p>
              <p className="text-2xl font-bold text-gray-900">{stats.newsletter}</p>
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Rechercher un utilisateur..."
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les rôles</option>
              {roles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            
            <button
              onClick={fetchUsers}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="loading-dots">
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun utilisateur trouvé</h3>
            <p className="text-gray-600">
              {searchTerm ? `Aucun utilisateur ne correspond à "${searchTerm}"` : 'Aucun utilisateur'}
            </p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <UserCard key={user.id} user={user} />
          ))
        )}
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

export default UserManagement;