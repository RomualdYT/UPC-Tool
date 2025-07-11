import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const SEOContext = createContext();

export const useSEO = () => {
  const context = useContext(SEOContext);
  if (!context) {
    throw new Error('useSEO must be used within an SEOProvider');
  }
  return context;
};

export const SEOProvider = ({ children }) => {
  const [seoData, setSeoData] = useState({});
  const [defaultSEO, setDefaultSEO] = useState({});
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  // Load default SEO configuration
  useEffect(() => {
    const loadDefaultSEO = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/admin/settings`);
        const seoConfig = response.data.seo_config;
        if (seoConfig) {
          setDefaultSEO(seoConfig);
        }
      } catch (error) {
        console.error('Error loading default SEO config:', error);
        // Set fallback defaults
        setDefaultSEO({
          default_title: 'UPC Legal - Décisions et Ordonnances',
          default_description: 'Recherchez et analysez instantanément les décisions et ordonnances de la Cour Unifiée du Brevet',
          default_keywords: ['UPC', 'brevet', 'décisions', 'juridique', 'cour unifiée'],
          site_name: 'UPC Legal',
          twitter_handle: '@upc_legal',
          og_image: '/assets/og-image.jpg',
          canonical_base_url: window.location.origin
        });
      }
    };

    loadDefaultSEO();
  }, [BACKEND_URL]);

  // Load page-specific SEO data
  useEffect(() => {
    const loadPageSEO = async () => {
      if (!location.pathname) return;
      
      setLoading(true);
      try {
        const response = await axios.get(`${BACKEND_URL}/api/seo/metadata`, {
          params: { page_path: location.pathname }
        });
        setSeoData(response.data);
      } catch (error) {
        console.error('Error loading page SEO data:', error);
        // Use default SEO for this page
        setSeoData({
          title: defaultSEO.default_title,
          description: defaultSEO.default_description,
          keywords: defaultSEO.default_keywords || [],
          canonical_url: `${defaultSEO.canonical_base_url}${location.pathname}`
        });
      } finally {
        setLoading(false);
      }
    };

    if (Object.keys(defaultSEO).length > 0) {
      loadPageSEO();
    }
  }, [location.pathname, defaultSEO, BACKEND_URL]);

  const updatePageSEO = (newSeoData) => {
    setSeoData(prevData => ({
      ...prevData,
      ...newSeoData
    }));
  };

  const getPageSEO = () => {
    return {
      title: seoData.title || defaultSEO.default_title,
      description: seoData.description || defaultSEO.default_description,
      keywords: seoData.keywords || defaultSEO.default_keywords || [],
      ogTitle: seoData.og_title || seoData.title || defaultSEO.default_title,
      ogDescription: seoData.og_description || seoData.description || defaultSEO.default_description,
      ogImage: seoData.og_image || defaultSEO.og_image,
      ogType: seoData.og_type || 'website',
      twitterCard: seoData.twitter_card || 'summary_large_image',
      twitterTitle: seoData.twitter_title || seoData.og_title || seoData.title,
      twitterDescription: seoData.twitter_description || seoData.og_description || seoData.description,
      twitterImage: seoData.twitter_image || seoData.og_image || defaultSEO.og_image,
      canonicalUrl: seoData.canonical_url || `${defaultSEO.canonical_base_url}${location.pathname}`,
      structuredData: seoData.schema_markup
    };
  };

  const generateCaseSEO = (caseData) => {
    const title = `${caseData.registry_number} - ${caseData.type} | UPC Legal`;
    const description = `Analyse détaillée de la décision ${caseData.registry_number} du ${caseData.date} - ${caseData.court_division}. ${caseData.summary.substring(0, 150)}...`;
    const keywords = [
      'UPC',
      'décision',
      caseData.type.toLowerCase(),
      ...caseData.tags || [],
      ...caseData.legal_norms || [],
      caseData.court_division.split(' ')[0] // Extract court location
    ].filter(Boolean);

    return {
      title,
      description,
      keywords,
      ogTitle: title,
      ogDescription: description,
      ogType: 'article',
      canonicalUrl: `${defaultSEO.canonical_base_url}/cases/${caseData.id}`
    };
  };

  const generateSearchSEO = (query, resultsCount) => {
    const title = query 
      ? `Recherche "${query}" - ${resultsCount} résultats | UPC Legal`
      : 'Recherche de décisions UPC | UPC Legal';
    const description = query
      ? `${resultsCount} décisions trouvées pour "${query}" dans la base de données UPC Legal. Recherchez parmi les décisions et ordonnances de la Cour Unifiée du Brevet.`
      : 'Recherchez parmi les décisions et ordonnances de la Cour Unifiée du Brevet. Base de données complète et mise à jour régulièrement.';

    return {
      title,
      description,
      keywords: ['recherche', 'UPC', 'décisions', 'brevets', ...(query ? [query] : [])],
      ogTitle: title,
      ogDescription: description,
      canonicalUrl: `${defaultSEO.canonical_base_url}/search${query ? `?q=${encodeURIComponent(query)}` : ''}`
    };
  };

  const generateDashboardSEO = (stats) => {
    const title = 'Tableau de bord - Statistiques UPC Legal';
    const description = `Découvrez les statistiques de la base de données UPC Legal : ${stats.total_cases || 0} décisions référencées, analyses par juridiction et évolution temporelle.`;

    return {
      title,
      description,
      keywords: ['tableau de bord', 'statistiques', 'UPC', 'analyse', 'données'],
      ogTitle: title,
      ogDescription: description,
      canonicalUrl: `${defaultSEO.canonical_base_url}/dashboard`
    };
  };

  const value = {
    seoData,
    defaultSEO,
    loading,
    updatePageSEO,
    getPageSEO,
    generateCaseSEO,
    generateSearchSEO,
    generateDashboardSEO
  };

  return (
    <SEOContext.Provider value={value}>
      {children}
    </SEOContext.Provider>
  );
};