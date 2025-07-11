import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Layout, 
  Save, 
  Eye, 
  Edit, 
  Plus, 
  Trash2, 
  Link as LinkIcon,
  X,
  ExternalLink
} from 'lucide-react';

const FooterManager = ({ backendUrl, getAuthHeaders }) => {
  const [footerData, setFooterData] = useState({
    content: '',
    links: [],
    social_media: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchFooterData = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/footer`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setFooterData(data);
      }
    } catch (error) {
      console.error('Error fetching footer data:', error);
      setNotification({
        message: 'Erreur lors du chargement du footer',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFooterData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${backendUrl}/api/admin/footer`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(footerData)
      });

      if (response.ok) {
        setNotification({
          message: 'Footer mis à jour avec succès',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error saving footer:', error);
      setNotification({
        message: 'Erreur lors de la sauvegarde',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const addLink = () => {
    setFooterData(prev => ({
      ...prev,
      links: [...prev.links, { title: '', url: '', target: '_self' }]
    }));
  };

  const updateLink = (index, field, value) => {
    setFooterData(prev => ({
      ...prev,
      links: prev.links.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      )
    }));
  };

  const removeLink = (index) => {
    setFooterData(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };

  const addSocialMedia = () => {
    setFooterData(prev => ({
      ...prev,
      social_media: [...prev.social_media, { platform: '', url: '', icon: '' }]
    }));
  };

  const updateSocialMedia = (index, field, value) => {
    setFooterData(prev => ({
      ...prev,
      social_media: prev.social_media.map((social, i) => 
        i === index ? { ...social, [field]: value } : social
      )
    }));
  };

  const removeSocialMedia = (index) => {
    setFooterData(prev => ({
      ...prev,
      social_media: prev.social_media.filter((_, i) => i !== index)
    }));
  };

  const FooterPreview = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 text-white p-8 rounded-lg"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Content */}
          <div className="md:col-span-2">
            <p className="text-gray-300 mb-6">
              {footerData.content || 'Contenu du footer...'}
            </p>
          </div>

          {/* Links */}
          {footerData.links.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Liens utiles</h3>
              <ul className="space-y-2">
                {footerData.links.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.url}
                      target={link.target}
                      className="text-gray-300 hover:text-white transition-colors flex items-center space-x-2"
                    >
                      <LinkIcon className="h-4 w-4" />
                      <span>{link.title}</span>
                      {link.target === '_blank' && <ExternalLink className="h-3 w-3" />}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Social Media */}
        {footerData.social_media.length > 0 && (
          <div className="mt-8 pt-8 border-t border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Suivez-nous</h3>
            <div className="flex space-x-4">
              {footerData.social_media.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {social.platform}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 pt-8 border-t border-gray-700 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} UPC Legal. Tous droits réservés.
          </p>
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
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
          <h2 className="text-xl font-semibold text-gray-900">Gestion du Footer</h2>
          <p className="text-gray-600">Personnalisez le contenu du footer du site</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setPreview(!preview)}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {preview ? <Edit className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span>{preview ? 'Modifier' : 'Aperçu'}</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <div className="loading-dots">
                <div></div>
                <div></div>
                <div></div>
              </div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
          </button>
        </div>
      </div>

      {preview ? (
        <FooterPreview />
      ) : (
        <div className="space-y-6">
          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Layout className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">Contenu principal</h3>
            </div>
            <textarea
              value={footerData.content}
              onChange={(e) => setFooterData(prev => ({ ...prev, content: e.target.value }))}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Décrivez votre entreprise, vos services, ou ajoutez des informations importantes..."
            />
          </div>

          {/* Links */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <LinkIcon className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-medium text-gray-900">Liens utiles</h3>
              </div>
              <button
                onClick={addLink}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>Ajouter un lien</span>
              </button>
            </div>

            <div className="space-y-4">
              {footerData.links.map((link, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    value={link.title}
                    onChange={(e) => updateLink(index, 'title', e.target.value)}
                    placeholder="Titre du lien"
                    className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => updateLink(index, 'url', e.target.value)}
                    placeholder="https://..."
                    className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={link.target}
                    onChange={(e) => updateLink(index, 'target', e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="_self">Même onglet</option>
                    <option value="_blank">Nouvel onglet</option>
                  </select>
                  <button
                    onClick={() => removeLink(index)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              
              {footerData.links.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <LinkIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucun lien ajouté</p>
                </div>
              )}
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <ExternalLink className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-medium text-gray-900">Réseaux sociaux</h3>
              </div>
              <button
                onClick={addSocialMedia}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>Ajouter un réseau</span>
              </button>
            </div>

            <div className="space-y-4">
              {footerData.social_media.map((social, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <select
                    value={social.platform}
                    onChange={(e) => updateSocialMedia(index, 'platform', e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionnez une plateforme</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Twitter">Twitter</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Instagram">Instagram</option>
                    <option value="YouTube">YouTube</option>
                  </select>
                  <input
                    type="url"
                    value={social.url}
                    onChange={(e) => updateSocialMedia(index, 'url', e.target.value)}
                    placeholder="https://..."
                    className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => removeSocialMedia(index)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              
              {footerData.social_media.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <ExternalLink className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucun réseau social ajouté</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

export default FooterManager;