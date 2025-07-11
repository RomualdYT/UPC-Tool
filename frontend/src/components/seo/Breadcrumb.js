import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { generateBreadcrumbStructuredData } from './StructuredData';
import MetaTags from './MetaTags';

const Breadcrumb = ({ customBreadcrumbs = [] }) => {
  const location = useLocation();

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = () => {
    if (customBreadcrumbs.length > 0) {
      return customBreadcrumbs;
    }

    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [
      { name: 'Accueil', url: '/', icon: Home }
    ];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Map segments to readable names
      let name = segment;
      switch (segment) {
        case 'cases':
          name = 'Décisions';
          break;
        case 'upc-code':
          name = 'Code UPC';
          break;
        case 'dashboard':
          name = 'Tableau de bord';
          break;
        case 'search':
          name = 'Recherche';
          break;
        case 'admin':
          name = 'Administration';
          break;
        default:
          // For IDs, try to make them more readable
          if (segment.length > 10) {
            name = `${segment.substring(0, 8)}...`;
          }
          break;
      }

      breadcrumbs.push({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        url: currentPath
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();
  const structuredData = generateBreadcrumbStructuredData(breadcrumbs);

  return (
    <>
      <MetaTags structuredData={structuredData} />
      <motion.nav 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        aria-label="Breadcrumb" 
        className="bg-white/80 backdrop-blur-sm rounded-lg border border-orange-200 shadow-sm mb-6"
      >
        <div className="px-4 py-3">
          <ol className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <li key={crumb.url} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 text-orange-400 mx-2 flex-shrink-0" />
                )}
                
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-orange-900 font-semibold flex items-center space-x-2 bg-orange-50 px-3 py-1.5 rounded-md border border-orange-200">
                    {crumb.icon && <crumb.icon className="h-4 w-4 text-orange-600" />}
                    <span>{crumb.name}</span>
                  </span>
                ) : (
                  <Link
                    to={crumb.url}
                    className="text-orange-600 hover:text-orange-800 transition-colors font-medium flex items-center space-x-2 px-3 py-1.5 rounded-md hover:bg-orange-50 border border-transparent hover:border-orange-200"
                  >
                    {crumb.icon && <crumb.icon className="h-4 w-4" />}
                    <span>{crumb.name}</span>
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </div>
      </motion.nav>
    </>
  );
};

export default Breadcrumb;