import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Send, 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Clock, 
  Check, 
  X,
  Download,
  Upload,
  Filter,
  Search,
  Calendar,
  FileText,
  Settings
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const NewsletterManagement = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('campaigns');
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    subject: '',
    content: '',
    html_content: '',
    schedule_at: ''
  });
  const [subscriberFilter, setSubscriberFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [emailConfig, setEmailConfig] = useState({});
  const [showEmailConfig, setShowEmailConfig] = useState(false);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    loadData();
    loadEmailConfig();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [campaignsRes, subscribersRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/admin/newsletter/campaigns`),
        axios.get(`${BACKEND_URL}/api/admin/newsletter/subscribers`)
      ]);
      setCampaigns(campaignsRes.data);
      setSubscribers(subscribersRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmailConfig = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/email-service`);
      setEmailConfig(response.data);
    } catch (error) {
      console.error('Error loading email config:', error);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/admin/newsletter/campaigns`, campaignForm);
      setCampaigns([response.data, ...campaigns]);
      setShowCampaignModal(false);
      resetCampaignForm();
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  const handleUpdateCampaign = async () => {
    try {
      const response = await axios.put(
        `${BACKEND_URL}/api/admin/newsletter/campaigns/${editingCampaign.id}`,
        campaignForm
      );
      setCampaigns(campaigns.map(c => c.id === editingCampaign.id ? response.data : c));
      setShowCampaignModal(false);
      setEditingCampaign(null);
      resetCampaignForm();
    } catch (error) {
      console.error('Error updating campaign:', error);
    }
  };

  const handleSendCampaign = async (campaignId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir envoyer cette campagne ?')) return;
    
    try {
      await axios.post(`${BACKEND_URL}/api/admin/newsletter/campaigns/${campaignId}/send`);
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error sending campaign:', error);
    }
  };

  const handleDeleteSubscriber = async (subscriberId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet abonné ?')) return;
    
    try {
      await axios.delete(`${BACKEND_URL}/api/admin/newsletter/subscribers/${subscriberId}`);
      setSubscribers(subscribers.filter(s => s.id !== subscriberId));
    } catch (error) {
      console.error('Error deleting subscriber:', error);
    }
  };

  const resetCampaignForm = () => {
    setCampaignForm({
      title: '',
      subject: '',
      content: '',
      html_content: '',
      schedule_at: ''
    });
  };

  const openEditCampaign = (campaign) => {
    setEditingCampaign(campaign);
    setCampaignForm({
      title: campaign.title,
      subject: campaign.subject,
      content: campaign.content,
      html_content: campaign.html_content || '',
      schedule_at: campaign.scheduled_at ? new Date(campaign.scheduled_at).toISOString().slice(0, 16) : ''
    });
    setShowCampaignModal(true);
  };

  const filteredSubscribers = subscribers.filter(subscriber => {
    const matchesFilter = subscriberFilter === 'all' || subscriber.status === subscriberFilter;
    const matchesSearch = !searchTerm || 
      subscriber.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getCampaignStatusBadge = (status) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return styles[status] || styles.draft;
  };

  const getSubscriberStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      bounced: 'bg-red-100 text-red-800',
      complained: 'bg-orange-100 text-orange-800'
    };
    return styles[status] || styles.active;
  };

  if (loading && campaigns.length === 0) {
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
            <Mail className="h-7 w-7 text-orange-600" />
            <span>Gestion Newsletter</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Gérez vos campagnes newsletter et vos abonnés
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowEmailConfig(true)}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Settings className="h-4 w-4" />
            <span>Configuration Email</span>
          </button>
          <button
            onClick={() => setShowCampaignModal(true)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nouvelle Campagne</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Campagnes</p>
              <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
            </div>
            <FileText className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Abonnés Actifs</p>
              <p className="text-2xl font-bold text-gray-900">
                {subscribers.filter(s => s.status === 'active').length}
              </p>
            </div>
            <Users className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Campagnes Envoyées</p>
              <p className="text-2xl font-bold text-gray-900">
                {campaigns.filter(c => c.status === 'sent').length}
              </p>
            </div>
            <Send className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Service Email</p>
              <p className="text-lg font-semibold text-gray-900">
                {emailConfig.type || 'Non configuré'}
              </p>
            </div>
            <Settings className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'campaigns'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Campagnes
          </button>
          <button
            onClick={() => setActiveTab('subscribers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'subscribers'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Abonnés
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'campaigns' ? (
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune campagne
              </h3>
              <p className="text-gray-600 mb-4">
                Commencez par créer votre première campagne newsletter.
              </p>
              <button
                onClick={() => setShowCampaignModal(true)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
              >
                Créer une campagne
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {campaigns.map((campaign) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {campaign.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCampaignStatusBadge(campaign.status)}`}>
                          {campaign.status === 'draft' && 'Brouillon'}
                          {campaign.status === 'scheduled' && 'Programmée'}
                          {campaign.status === 'sent' && 'Envoyée'}
                          {campaign.status === 'failed' && 'Échec'}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{campaign.subject}</p>
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{campaign.recipients_count} destinataires</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {campaign.sent_at 
                              ? `Envoyée le ${new Date(campaign.sent_at).toLocaleDateString('fr-FR')}`
                              : campaign.scheduled_at
                              ? `Programmée pour le ${new Date(campaign.scheduled_at).toLocaleDateString('fr-FR')}`
                              : `Créée le ${new Date(campaign.created_at).toLocaleDateString('fr-FR')}`
                            }
                          </span>
                        </div>
                        {campaign.status === 'sent' && (
                          <div className="flex items-center space-x-1">
                            <Send className="h-4 w-4" />
                            <span>{campaign.sent_count} envoyés</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {campaign.status === 'draft' && (
                        <>
                          <button
                            onClick={() => openEditCampaign(campaign)}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleSendCampaign(campaign.id)}
                            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors flex items-center space-x-1"
                          >
                            <Send className="h-4 w-4" />
                            <span>Envoyer</span>
                          </button>
                        </>
                      )}
                      {campaign.status === 'sent' && (
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Subscribers filters */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <select
              value={subscriberFilter}
              onChange={(e) => setSubscriberFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
              <option value="bounced">Bounced</option>
              <option value="complained">Complained</option>
            </select>
          </div>

          {/* Subscribers list */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Abonnés ({filteredSubscribers.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {filteredSubscribers.map((subscriber) => (
                <div key={subscriber.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <p className="font-medium text-gray-900">{subscriber.email}</p>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSubscriberStatusBadge(subscriber.status)}`}>
                        {subscriber.status === 'active' && 'Actif'}
                        {subscriber.status === 'inactive' && 'Inactif'}
                        {subscriber.status === 'bounced' && 'Bounced'}
                        {subscriber.status === 'complained' && 'Complained'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                      <span>
                        Inscrit le {new Date(subscriber.opt_in_date).toLocaleDateString('fr-FR')}
                      </span>
                      <span>Source: {subscriber.source}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteSubscriber(subscriber.id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {filteredSubscribers.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500">
                  Aucun abonné trouvé.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Campaign Modal */}
      <AnimatePresence>
        {showCampaignModal && (
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
              className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {editingCampaign ? 'Modifier la campagne' : 'Nouvelle campagne'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowCampaignModal(false);
                      setEditingCampaign(null);
                      resetCampaignForm();
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Titre de la campagne
                    </label>
                    <input
                      type="text"
                      value={campaignForm.title}
                      onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Ex: Newsletter UPC Legal - Janvier 2025"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sujet de l'email
                    </label>
                    <input
                      type="text"
                      value={campaignForm.subject}
                      onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Ex: Nouvelles décisions UPC et analyses juridiques"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contenu (texte)
                    </label>
                    <textarea
                      value={campaignForm.content}
                      onChange={(e) => setCampaignForm({ ...campaignForm, content: e.target.value })}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Contenu texte de votre newsletter..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contenu HTML (optionnel)
                    </label>
                    <textarea
                      value={campaignForm.html_content}
                      onChange={(e) => setCampaignForm({ ...campaignForm, html_content: e.target.value })}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                      placeholder="<html>...</html>"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Programmer l'envoi (optionnel)
                    </label>
                    <input
                      type="datetime-local"
                      value={campaignForm.schedule_at}
                      onChange={(e) => setCampaignForm({ ...campaignForm, schedule_at: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowCampaignModal(false);
                      setEditingCampaign(null);
                      resetCampaignForm();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={editingCampaign ? handleUpdateCampaign : handleCreateCampaign}
                    disabled={!campaignForm.title || !campaignForm.subject || !campaignForm.content}
                    className="px-6 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {editingCampaign ? 'Mettre à jour' : 'Créer'}
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

export default NewsletterManagement;