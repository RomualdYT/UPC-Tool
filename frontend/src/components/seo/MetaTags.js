import { useEffect } from 'react';

const MetaTags = ({
  title,
  description,
  keywords = [],
  ogTitle,
  ogDescription,
  ogImage,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  twitterTitle,
  twitterDescription,
  twitterImage,
  canonicalUrl,
  structuredData,
  noIndex = false,
  noFollow = false
}) => {
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = title;
    }

    // Remove existing meta tags
    const existingMetas = document.querySelectorAll('meta[data-dynamic="true"]');
    existingMetas.forEach(meta => meta.remove());

    // Remove existing canonical link
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }

    // Remove existing structured data
    const existingStructuredData = document.querySelector('script[type="application/ld+json"][data-dynamic="true"]');
    if (existingStructuredData) {
      existingStructuredData.remove();
    }

    // Basic meta tags
    if (description) {
      const metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      metaDescription.content = description;
      metaDescription.setAttribute('data-dynamic', 'true');
      document.head.appendChild(metaDescription);
    }

    if (keywords.length > 0) {
      const metaKeywords = document.createElement('meta');
      metaKeywords.name = 'keywords';
      metaKeywords.content = keywords.join(', ');
      metaKeywords.setAttribute('data-dynamic', 'true');
      document.head.appendChild(metaKeywords);
    }

    // Robots meta tag
    if (noIndex || noFollow) {
      const robotsContent = [];
      if (noIndex) robotsContent.push('noindex');
      if (noFollow) robotsContent.push('nofollow');
      
      const metaRobots = document.createElement('meta');
      metaRobots.name = 'robots';
      metaRobots.content = robotsContent.join(', ');
      metaRobots.setAttribute('data-dynamic', 'true');
      document.head.appendChild(metaRobots);
    }

    // Open Graph meta tags
    const ogTags = [
      { property: 'og:title', content: ogTitle || title },
      { property: 'og:description', content: ogDescription || description },
      { property: 'og:type', content: ogType },
      { property: 'og:site_name', content: 'UPC Legal' },
      { property: 'og:locale', content: 'fr_FR' }
    ];

    if (ogImage) {
      ogTags.push({ property: 'og:image', content: ogImage });
      ogTags.push({ property: 'og:image:alt', content: ogTitle || title });
    }

    if (canonicalUrl) {
      ogTags.push({ property: 'og:url', content: canonicalUrl });
    }

    ogTags.forEach(tag => {
      if (tag.content) {
        const meta = document.createElement('meta');
        meta.property = tag.property;
        meta.content = tag.content;
        meta.setAttribute('data-dynamic', 'true');
        document.head.appendChild(meta);
      }
    });

    // Twitter Card meta tags
    const twitterTags = [
      { name: 'twitter:card', content: twitterCard },
      { name: 'twitter:title', content: twitterTitle || ogTitle || title },
      { name: 'twitter:description', content: twitterDescription || ogDescription || description },
      { name: 'twitter:site', content: '@upc_legal' },
      { name: 'twitter:creator', content: '@upc_legal' }
    ];

    if (twitterImage || ogImage) {
      twitterTags.push({ name: 'twitter:image', content: twitterImage || ogImage });
    }

    twitterTags.forEach(tag => {
      if (tag.content) {
        const meta = document.createElement('meta');
        meta.name = tag.name;
        meta.content = tag.content;
        meta.setAttribute('data-dynamic', 'true');
        document.head.appendChild(meta);
      }
    });

    // Additional meta tags for legal content
    const additionalTags = [
      { name: 'author', content: 'UPC Legal' },
      { name: 'publisher', content: 'UPC Legal' },
      { name: 'application-name', content: 'UPC Legal' },
      { name: 'theme-color', content: '#ea580c' },
      { name: 'msapplication-TileColor', content: '#ea580c' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      { name: 'format-detection', content: 'telephone=no' }
    ];

    additionalTags.forEach(tag => {
      const meta = document.createElement('meta');
      meta.name = tag.name;
      meta.content = tag.content;
      meta.setAttribute('data-dynamic', 'true');
      document.head.appendChild(meta);
    });

    // Canonical URL
    if (canonicalUrl) {
      const link = document.createElement('link');
      link.rel = 'canonical';
      link.href = canonicalUrl;
      document.head.appendChild(link);
    }

    // Structured Data (JSON-LD)
    if (structuredData) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-dynamic', 'true');
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    // Geographic meta tags for legal content
    const geoTags = [
      { name: 'geo.region', content: 'EU' },
      { name: 'geo.placename', content: 'European Union' },
      { name: 'ICBM', content: '50.8503,4.3517' }, // Brussels coordinates
      { name: 'DC.coverage', content: 'EU' },
      { name: 'DC.language', content: 'fr' }
    ];

    geoTags.forEach(tag => {
      const meta = document.createElement('meta');
      meta.name = tag.name;
      meta.content = tag.content;
      meta.setAttribute('data-dynamic', 'true');
      document.head.appendChild(meta);
    });

  }, [
    title,
    description,
    keywords,
    ogTitle,
    ogDescription,
    ogImage,
    ogType,
    twitterCard,
    twitterTitle,
    twitterDescription,
    twitterImage,
    canonicalUrl,
    structuredData,
    noIndex,
    noFollow
  ]);

  return null;
};

export default MetaTags;