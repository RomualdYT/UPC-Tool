import React from 'react';
import { Helmet } from 'react-helmet-async';

// Structured Data for Legal Cases
export const LegalCaseStructuredData = ({ caseData }) => {
  if (!caseData) return null;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LegalCase",
    "name": caseData.reference,
    "description": caseData.summary,
    "dateCreated": caseData.date,
    "url": `${window.location.origin}/cases/${caseData.id}`,
    "identifier": caseData.registry_number,
    "court": {
      "@type": "Courthouse",
      "name": caseData.court_division,
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "EU"
      }
    },
    "caseNumber": caseData.registry_number,
    "caseType": caseData.type,
    "language": caseData.language_of_proceedings,
    "party": caseData.parties?.map(party => ({
      "@type": "Organization",
      "name": party
    })) || [],
    "legalNorms": caseData.legal_norms || [],
    "keywords": caseData.tags?.join(', ') || '',
    "document": caseData.documents?.map(doc => ({
      "@type": "DigitalDocument",
      "name": doc.title,
      "url": doc.url,
      "inLanguage": doc.language
    })) || []
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

// Structured Data for Organization
export const OrganizationStructuredData = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Romulus 2",
    "description": "Advanced UPC Legal Analysis Platform",
    "url": window.location.origin,
    "logo": `${window.location.origin}/logo.png`,
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "support@romulus2.com"
    },
    "sameAs": [
      "https://twitter.com/romulus2",
      "https://linkedin.com/company/romulus2"
    ],
    "founder": {
      "@type": "Person",
      "name": "Romulus 2 Team"
    },
    "foundingDate": "2023",
    "industry": "Legal Technology",
    "knowsAbout": [
      "Unified Patent Court",
      "Patent Law",
      "IP Law",
      "Legal Analysis",
      "Court Decisions"
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

// Structured Data for Search Results
export const SearchResultsStructuredData = ({ searchQuery, results, totalResults }) => {
  if (!results || results.length === 0) return null;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SearchResultsPage",
    "name": `Search Results for "${searchQuery}"`,
    "description": `Found ${totalResults} legal cases matching "${searchQuery}"`,
    "url": `${window.location.origin}/search?q=${encodeURIComponent(searchQuery)}`,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": totalResults,
      "itemListElement": results.slice(0, 10).map((case_item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "LegalCase",
          "name": case_item.reference,
          "description": case_item.summary,
          "url": `${window.location.origin}/cases/${case_item.id}`,
          "dateCreated": case_item.date,
          "court": {
            "@type": "Courthouse",
            "name": case_item.court_division
          }
        }
      }))
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

// Structured Data for Statistics Dashboard
export const DashboardStructuredData = ({ stats }) => {
  if (!stats) return null;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": "UPC Legal Cases Statistics",
    "description": "Comprehensive statistics and analytics of Unified Patent Court cases",
    "url": `${window.location.origin}/dashboard`,
    "publisher": {
      "@type": "Organization",
      "name": "Romulus 2"
    },
    "dateModified": new Date().toISOString(),
    "keywords": [
      "UPC statistics",
      "patent court data",
      "legal analytics",
      "IP law trends"
    ],
    "distribution": {
      "@type": "DataDownload",
      "encodingFormat": "application/json",
      "contentUrl": `${window.location.origin}/api/stats`
    },
    "measurementTechnique": "Legal case analysis and classification",
    "variableMeasured": [
      "Case count by type",
      "Court division activity",
      "Language distribution",
      "Monthly trends"
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

// Structured Data for FAQ
export const FAQStructuredData = ({ faqs }) => {
  if (!faqs || faqs.length === 0) return null;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

// Structured Data for Breadcrumbs
export const BreadcrumbStructuredData = ({ breadcrumbs }) => {
  if (!breadcrumbs || breadcrumbs.length === 0) return null;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((breadcrumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": breadcrumb.name,
      "item": breadcrumb.url
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export default {
  LegalCaseStructuredData,
  OrganizationStructuredData,
  SearchResultsStructuredData,
  DashboardStructuredData,
  FAQStructuredData,
  BreadcrumbStructuredData
};