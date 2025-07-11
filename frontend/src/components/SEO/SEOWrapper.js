import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import MetaTags from './MetaTags';
import { OrganizationStructuredData } from './StructuredData';
import { useSEO } from '../../contexts/SEOContext';

const SEOWrapper = ({ children }) => {
  const { seoData } = useSEO();
  
  return (
    <HelmetProvider>
      <MetaTags {...seoData} />
      <OrganizationStructuredData />
      {children}
    </HelmetProvider>
  );
};

export default SEOWrapper;