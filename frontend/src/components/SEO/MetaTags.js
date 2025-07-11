import React from 'react';
import { Helmet } from 'react-helmet-async';

const MetaTags = ({ 
  title = "Romulus 2 - UPC Legal Analysis", 
  description = "Advanced search and analysis of Unified Patent Court decisions and orders. Instant access to legal data, trends, and insights.",
  keywords = "UPC, Unified Patent Court, legal analysis, patent decisions, IP law, intellectual property",
  canonical = window.location.href,
  ogImage = "/og-image.jpg",
  type = "website",
  author = "Romulus 2",
  publishedTime,
  modifiedTime,
  section,
  tags = []
}) => {
  const siteName = "Romulus 2 - UPC Legal Analysis";
  const siteUrl = window.location.origin;
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="canonical" href={canonical} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`} />
      <meta name="twitter:site" content="@romulus2" />
      <meta name="twitter:creator" content="@romulus2" />
      
      {/* Additional Meta Tags for Articles */}
      {type === 'article' && (
        <>
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {section && <meta property="article:section" content={section} />}
          {tags.length > 0 && tags.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Additional SEO Meta Tags */}
      <meta name="robots" content="index,follow" />
      <meta name="googlebot" content="index,follow" />
      <meta name="bingbot" content="index,follow" />
      <meta name="theme-color" content="#f97316" />
      <meta name="msapplication-TileColor" content="#f97316" />
      
      {/* Geo Tags for Legal Content */}
      <meta name="geo.region" content="EU" />
      <meta name="geo.placename" content="European Union" />
      <meta name="ICBM" content="50.8503, 4.3517" />
      
      {/* Language and Content Tags */}
      <meta httpEquiv="Content-Language" content="en" />
      <meta name="language" content="en" />
      <meta name="content-type" content="text/html; charset=UTF-8" />
      
      {/* Security and Performance */}
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="msapplication-tap-highlight" content="no" />
      
      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": siteName,
          "description": description,
          "url": siteUrl,
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": `${siteUrl}/search?q={search_term_string}`
            },
            "query-input": "required name=search_term_string"
          },
          "author": {
            "@type": "Organization",
            "name": author
          },
          "publisher": {
            "@type": "Organization",
            "name": author
          }
        })}
      </script>
    </Helmet>
  );
};

export default MetaTags;