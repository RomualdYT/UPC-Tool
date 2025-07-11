import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, LinkIcon } from 'lucide-react';

const Footer = () => {
  const [footerContent, setFooterContent] = useState({
    content: 'Powered by Romulus 2 - Advanced UPC Legal Analysis',
    links: [],
    social_media: []
  });

  const fetchFooterContent = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/footer`);
      if (response.ok) {
        const data = await response.json();
        setFooterContent(data);
      }
    } catch (error) {
      console.error('Error fetching footer content:', error);
    }
  };

  useEffect(() => {
    fetchFooterContent();
  }, []);

  return (
    <footer className="bg-gray-800 text-white py-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Content */}
          <div className="md:col-span-2">
            <p className="text-gray-300 mb-4 leading-relaxed">
              {footerContent.content}
            </p>
          </div>

          {/* Links */}
          {footerContent.links && footerContent.links.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Liens utiles</h3>
              <ul className="space-y-2">
                {footerContent.links.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.url}
                      target={link.target || '_self'}
                      rel={link.target === '_blank' ? 'noopener noreferrer' : ''}
                      className="text-gray-300 hover:text-white transition-colors flex items-center space-x-2 text-sm"
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
        {footerContent.social_media && footerContent.social_media.length > 0 && (
          <div className="border-t border-gray-700 pt-8 mb-8">
            <h3 className="text-lg font-semibold mb-4">Suivez-nous</h3>
            <div className="flex space-x-6">
              {footerContent.social_media.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {social.platform}
                </motion.a>
              ))}
            </div>
          </div>
        )}

        {/* Copyright */}
        <div className="border-t border-gray-700 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} UPC Legal. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;