import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { BreadcrumbStructuredData } from './StructuredData';

const Breadcrumbs = ({ items = [], className = '' }) => {
  if (!items || items.length === 0) return null;

  const breadcrumbItems = [
    { name: 'Home', url: '/', icon: Home },
    ...items
  ];

  return (
    <>
      <BreadcrumbStructuredData breadcrumbs={breadcrumbItems} />
      <nav className={`flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 ${className}`} aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          {breadcrumbItems.map((item, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 mx-2" />
              )}
              {index === breadcrumbItems.length - 1 ? (
                <span className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                  {item.icon && <item.icon className="h-4 w-4 mr-1" />}
                  {item.name}
                </span>
              ) : (
                <a
                  href={item.url}
                  className="text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 flex items-center transition-colors"
                >
                  {item.icon && <item.icon className="h-4 w-4 mr-1" />}
                  {item.name}
                </a>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
};

export default Breadcrumbs;