// Utility functions for generating Schema.org structured data

export const generateOrganizationStructuredData = () => {
  return {
    "@context": "https://schema.org",
    "@type": "LegalService",
    "name": "UPC Legal",
    "description": "Service d'analyse et de recherche des décisions de la Cour Unifiée du Brevet",
    "url": "https://upc-legal.com",
    "logo": "https://upc-legal.com/logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+33-1-xx-xx-xx-xx",
      "contactType": "customer service",
      "email": "contact@upc-legal.com",
      "availableLanguage": ["French", "English", "German"]
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "EU",
      "addressRegion": "European Union"
    },
    "sameAs": [
      "https://twitter.com/upc_legal",
      "https://linkedin.com/company/upc-legal"
    ],
    "serviceType": "Legal Research",
    "areaServed": {
      "@type": "Place",
      "name": "European Union"
    }
  };
};

export const generateLegalCaseStructuredData = (caseData) => {
  return {
    "@context": "https://schema.org",
    "@type": "LegalCase",
    "name": caseData.registry_number || caseData.order_reference,
    "description": caseData.summary,
    "dateCreated": caseData.date,
    "court": {
      "@type": "Courthouse",
      "name": caseData.court_division,
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "EU"
      }
    },
    "caseNumber": caseData.registry_number,
    "party": caseData.parties?.map(party => ({
      "@type": "Organization",
      "name": party
    })) || [],
    "about": caseData.tags?.map(tag => ({
      "@type": "Thing",
      "name": tag
    })) || [],
    "language": caseData.language_of_proceedings,
    "jurisdiction": "Unified Patent Court",
    "caseType": caseData.type,
    "legalNorms": caseData.legal_norms || [],
    "url": `https://upc-legal.com/cases/${caseData.id}`
  };
};

export const generateSearchResultsStructuredData = (results, query) => {
  return {
    "@context": "https://schema.org",
    "@type": "SearchResultsPage",
    "name": `Résultats de recherche pour "${query}"`,
    "description": `${results.length} résultats trouvés pour "${query}" dans la base de données UPC Legal`,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": results.length,
      "itemListElement": results.slice(0, 10).map((result, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "LegalCase",
          "name": result.registry_number || result.order_reference,
          "description": result.summary,
          "url": `https://upc-legal.com/cases/${result.id}`,
          "dateCreated": result.date
        }
      }))
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://upc-legal.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };
};

export const generateDashboardStructuredData = (stats) => {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": "Base de données UPC Legal",
    "description": "Collection complète des décisions et ordonnances de la Cour Unifiée du Brevet",
    "creator": {
      "@type": "Organization",
      "name": "UPC Legal"
    },
    "distribution": {
      "@type": "DataDownload",
      "encodingFormat": "application/json",
      "contentUrl": "https://upc-legal.com/api/cases"
    },
    "includedInDataCatalog": {
      "@type": "DataCatalog",
      "name": "UPC Legal Database"
    },
    "keywords": [
      "UPC", "Unified Patent Court", "brevets", "décisions juridiques", 
      "propriété intellectuelle", "droit européen"
    ],
    "license": "https://creativecommons.org/licenses/by-nc/4.0/",
    "measurementTechnique": "Legal document analysis",
    "variableMeasured": [
      "Court decisions",
      "Patent cases",
      "Legal precedents"
    ],
    "temporalCoverage": "2023/..",
    "spatialCoverage": {
      "@type": "Place",
      "name": "European Union"
    },
    "about": {
      "@type": "Thing",
      "name": "Patent Law",
      "sameAs": "https://en.wikipedia.org/wiki/Patent_law"
    }
  };
};

export const generateFAQStructuredData = (faqItems) => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };
};

export const generateBreadcrumbStructuredData = (breadcrumbs) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  };
};

export const generateWebSiteStructuredData = () => {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "UPC Legal",
    "description": "Plateforme de recherche et d'analyse des décisions de la Cour Unifiée du Brevet",
    "url": "https://upc-legal.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://upc-legal.com/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "UPC Legal",
      "logo": {
        "@type": "ImageObject",
        "url": "https://upc-legal.com/logo.png"
      }
    },
    "inLanguage": ["fr", "en", "de"],
    "copyrightYear": new Date().getFullYear(),
    "genre": "Legal Research",
    "audience": {
      "@type": "Audience",
      "audienceType": "Legal Professionals"
    }
  };
};