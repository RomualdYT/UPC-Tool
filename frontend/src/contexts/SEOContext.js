import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Contexte SEO
const SEOContext = createContext();

// Hook pour utiliser le contexte SEO
export const useSEO = () => {
  const context = useContext(SEOContext);
  if (!context) {
    throw new Error('useSEO must be used within a SEOProvider');
  }
  return context;
};

// Configuration SEO par défaut
const defaultSEOConfig = {
  siteName: 'Romulus 2 - UPC Legal Analysis',
  siteUrl: typeof window !== 'undefined' ? window.location.origin : '',
  defaultTitle: 'Romulus 2 - Advanced UPC Legal Analysis',
  defaultDescription: 'Advanced search and analysis of Unified Patent Court decisions and orders. Instant access to legal data, trends, and insights.',
  defaultKeywords: 'UPC, Unified Patent Court, legal analysis, patent decisions, IP law, intellectual property',
  defaultImage: '/og-image.jpg',
  twitterHandle: '@romulus2',
  author: 'Romulus 2 Team',
  language: 'en',
  themeColor: '#f97316'
};

// Templates SEO pour différentes pages
const seoTemplates = {
  home: {
    title: 'Romulus 2 - Advanced UPC Legal Analysis',
    description: 'Search and analyze Unified Patent Court decisions with advanced filtering, statistics, and export capabilities.',
    keywords: 'UPC search, patent court decisions, legal analysis, IP law database'
  },
  dashboard: {
    title: 'Dashboard - UPC Legal Analytics',
    description: 'Real-time statistics and trends of Unified Patent Court cases with interactive charts and insights.',
    keywords: 'UPC statistics, patent court analytics, legal trends, IP law dashboard'
  },
  search: {
    title: 'Search Results - UPC Legal Cases',
    description: 'Search results for Unified Patent Court decisions and orders with advanced filtering options.',
    keywords: 'UPC search results, patent court cases, legal search, IP decisions'
  },
  case: {
    title: 'Case Details - UPC Legal Analysis',
    description: 'Detailed information about a specific Unified Patent Court case including documents, parties, and legal analysis.',
    keywords: 'UPC case details, patent court decision, legal case analysis, IP law case'
  }
};

// Provider SEO
export const SEOProvider = ({ children }) => {
  const [seoData, setSEOData] = useState(defaultSEOConfig);
  const [currentPage, setCurrentPage] = useState('home');
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const location = useLocation();

  // Mettre à jour la page courante basée sur l'URL
  useEffect(() => {
    const path = location.pathname;
    if (path === '/') {
      setCurrentPage('home');
    } else if (path.startsWith('/dashboard')) {
      setCurrentPage('dashboard');
    } else if (path.startsWith('/search')) {
      setCurrentPage('search');
    } else if (path.startsWith('/cases/')) {
      setCurrentPage('case');
    } else {
      setCurrentPage('home');
    }
  }, [location]);

  // Fonctions pour mettre à jour les métadonnées SEO
  const updateSEO = (newSEOData) => {
    setSEOData(prev => ({
      ...prev,
      ...newSEOData
    }));
  };

  const updatePageSEO = (pageType, customData = {}) => {
    const template = seoTemplates[pageType] || seoTemplates.home;
    const updatedSEO = {
      ...defaultSEOConfig,
      ...template,
      ...customData
    };
    
    setSEOData(updatedSEO);
    setCurrentPage(pageType);
  };

  const updateBreadcrumbs = (newBreadcrumbs) => {
    setBreadcrumbs(newBreadcrumbs);
  };

  // Générer les métadonnées pour une page de cas spécifique
  const generateCaseSEO = (caseData) => {
    if (!caseData) return;
    
    const caseSEO = {
      title: `${caseData.reference} - UPC Case Details`,
      description: `Detailed analysis of ${caseData.reference}: ${caseData.summary?.substring(0, 150)}...`,
      keywords: `${caseData.reference}, ${caseData.type}, ${caseData.court_division}, ${caseData.tags?.join(', ') || ''}`,
      canonical: `${defaultSEOConfig.siteUrl}/cases/${caseData.id}`,
      type: 'article',
      publishedTime: caseData.date,
      section: 'Legal Cases',
      tags: caseData.tags || []
    };
    
    updateSEO(caseSEO);
    
    // Mettre à jour les breadcrumbs
    updateBreadcrumbs([
      { name: 'Cases', url: '/cases' },
      { name: caseData.reference, url: `/cases/${caseData.id}` }
    ]);
  };

  // Générer les métadonnées pour les résultats de recherche
  const generateSearchSEO = (searchQuery, resultCount) => {
    const searchSEO = {
      title: `Search: "${searchQuery}" - ${resultCount} Results`,
      description: `Found ${resultCount} UPC legal cases matching "${searchQuery}". Browse decisions, orders, and legal documents.`,
      keywords: `${searchQuery}, UPC search, patent court search, legal case search`,
      canonical: `${defaultSEOConfig.siteUrl}/search?q=${encodeURIComponent(searchQuery)}`,
      noIndex: resultCount === 0 // Don't index pages with no results
    };
    
    updateSEO(searchSEO);
    
    // Mettre à jour les breadcrumbs
    updateBreadcrumbs([
      { name: 'Search', url: '/search' },
      { name: `"${searchQuery}"`, url: `/search?q=${encodeURIComponent(searchQuery)}` }
    ]);
  };

  // Générer les métadonnées pour le dashboard
  const generateDashboardSEO = (stats) => {
    const totalCases = stats?.totalCases || 0;
    const dashboardSEO = {
      title: `Dashboard - ${totalCases} UPC Cases Analytics`,
      description: `Real-time analytics of ${totalCases} Unified Patent Court cases with statistics, trends, and insights.`,
      keywords: 'UPC dashboard, patent court statistics, legal analytics, IP law trends',
      canonical: `${defaultSEOConfig.siteUrl}/dashboard`
    };
    
    updateSEO(dashboardSEO);
    
    // Mettre à jour les breadcrumbs
    updateBreadcrumbs([
      { name: 'Dashboard', url: '/dashboard' }
    ]);
  };

  // Réinitialiser les métadonnées à la page d'accueil
  const resetToHome = () => {
    updatePageSEO('home');
    updateBreadcrumbs([]);
  };

  const value = {
    seoData,
    currentPage,
    breadcrumbs,
    updateSEO,
    updatePageSEO,
    updateBreadcrumbs,
    generateCaseSEO,
    generateSearchSEO,
    generateDashboardSEO,
    resetToHome
  };

  return (
    <SEOContext.Provider value={value}>
      {children}
    </SEOContext.Provider>
  );
};

export default SEOContext;