import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  LogOut, 
  Settings, 
  Shield, 
  ChevronDown,
  UserCircle,
  Star,
  Mail
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const UserMenu = () => {
  const { user, logout, isAdmin, isEditor } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const getRoleBadge = () => {
    if (isAdmin()) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <Shield className="w-3 h-3 mr-1" />
          Admin
        </span>
      );
    }
    if (isEditor()) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Star className="w-3 h-3 mr-1" />
          Rédacteur
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <UserCircle className="w-3 h-3 mr-1" />
        Utilisateur
      </span>
    );
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-3 py-2 bg-white/20 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-colors text-white h-[40px]"
      >
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-sm font-medium">{user?.username}</div>
            <div className="text-xs text-white/80">{user?.email}</div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{user?.username}</div>
                  <div className="text-sm text-gray-500 flex items-center space-x-1">
                    <Mail className="w-3 h-3" />
                    <span>{user?.email}</span>
                  </div>
                  <div className="mt-1">
                    {getRoleBadge()}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2">
              {user?.profile && (
                <div className="px-3 py-2 text-sm text-gray-600">
                  <span className="font-medium">Profil:</span> {user.profile}
                </div>
              )}
              
              {user?.newsletter_opt_in && (
                <div className="px-3 py-2 text-sm text-green-600">
                  ✓ Inscrit à la newsletter
                </div>
              )}

              <div className="border-t border-gray-200 mt-2 pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Se déconnecter</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserMenu;