import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
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
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.url}>
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
            {index === breadcrumbs.length - 1 ? (
              <span className="text-gray-900 font-medium flex items-center space-x-1">
                {crumb.icon && <crumb.icon className="h-4 w-4" />}
                <span>{crumb.name}</span>
              </span>
            ) : (
              <Link
                to={crumb.url}
                className="text-orange-600 hover:text-orange-700 transition-colors flex items-center space-x-1"
              >
                {crumb.icon && <crumb.icon className="h-4 w-4" />}
                <span>{crumb.name}</span>
              </Link>
            )}
          </React.Fragment>
        ))}
      </nav>
    </>
  );
};

export default Breadcrumb;