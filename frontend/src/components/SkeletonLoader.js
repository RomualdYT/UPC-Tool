import React from 'react';
import { motion } from 'framer-motion';

// Skeleton de base
const SkeletonBase = ({ className, animate = true }) => (
  <div
    className={`bg-gray-200 dark:bg-gray-700 rounded ${
      animate ? 'animate-pulse' : ''
    } ${className}`}
  />
);

// Skeleton pour les cartes de cas
export const CaseCardSkeleton = ({ count = 1 }) => (
  <div className="space-y-4">
    {[...Array(count)].map((_, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        className="romulus-card"
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            {/* Header avec badges */}
            <div className="flex items-center space-x-3 mb-3">
              <SkeletonBase className="h-6 w-16" />
              <SkeletonBase className="h-4 w-24" />
              <SkeletonBase className="h-4 w-20" />
            </div>
            
            {/* Titre */}
            <SkeletonBase className="h-6 w-3/4 mb-3" />
            
            {/* Résumé */}
            <div className="space-y-2 mb-3">
              <SkeletonBase className="h-4 w-full" />
              <SkeletonBase className="h-4 w-5/6" />
              <SkeletonBase className="h-4 w-4/6" />
            </div>
            
            {/* Parties */}
            <div className="flex flex-wrap gap-2 mb-3">
              {[...Array(3)].map((_, i) => (
                <SkeletonBase key={i} className="h-6 w-20" />
              ))}
            </div>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {[...Array(2)].map((_, i) => (
                <SkeletonBase key={i} className="h-5 w-16" />
              ))}
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="flex flex-col space-y-2">
            <div className="space-y-1">
              <SkeletonBase className="h-4 w-full" />
              <SkeletonBase className="h-4 w-3/4" />
              <SkeletonBase className="h-4 w-5/6" />
            </div>
            
            <div className="flex flex-col space-y-2 pt-2">
              <SkeletonBase className="h-10 w-full" />
              <SkeletonBase className="h-10 w-full" />
            </div>
          </div>
        </div>
      </motion.div>
    ))}
  </div>
);

// Skeleton pour le tableau
export const TableSkeleton = ({ rows = 5, columns = 6 }) => (
  <div className="romulus-card overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gradient-to-r from-orange-500 to-orange-600">
          <tr>
            {[...Array(columns)].map((_, index) => (
              <th key={index} className="px-5 py-4 text-left">
                <SkeletonBase className="h-4 w-20 bg-white/20" animate={false} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(rows)].map((_, rowIndex) => (
            <tr
              key={rowIndex}
              className={`border-b border-gray-100 ${
                rowIndex % 2 === 0 ? 'bg-white' : 'bg-orange-50'
              }`}
            >
              {[...Array(columns)].map((_, colIndex) => (
                <td key={colIndex} className="px-5 py-4">
                  <SkeletonBase className="h-4 w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Skeleton pour les statistiques du dashboard
export const DashboardStatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {[...Array(4)].map((_, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        className="bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 text-white rounded-xl shadow-lg p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <SkeletonBase className="h-4 w-24 mb-2 bg-white/20" animate={false} />
            <SkeletonBase className="h-8 w-16 mb-2 bg-white/20" animate={false} />
            <SkeletonBase className="h-3 w-20 bg-white/20" animate={false} />
          </div>
          <div className="p-3 bg-white/20 rounded-lg">
            <SkeletonBase className="h-8 w-8 bg-white/20" animate={false} />
          </div>
        </div>
      </motion.div>
    ))}
  </div>
);

// Skeleton pour les graphiques
export const ChartSkeleton = ({ title, height = 300 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
  >
    <div className="flex items-center justify-between mb-6">
      <SkeletonBase className="h-5 w-32" />
      <SkeletonBase className="h-4 w-20" />
    </div>
    <div className="space-y-3" style={{ height }}>
      {[...Array(5)].map((_, index) => (
        <div key={index} className="flex items-center space-x-3">
          <SkeletonBase className="h-4 w-20" />
          <div className="flex-1">
            <SkeletonBase 
              className="h-6 rounded-full" 
              style={{ width: `${Math.random() * 60 + 20}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  </motion.div>
);

// Skeleton pour les détails d'un cas
export const CaseDetailSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-orange-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
    {/* Header */}
    <div className="bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 text-white p-6 rounded-t-xl">
      <div className="flex items-center justify-between">
        <div>
          <SkeletonBase className="h-8 w-64 mb-2 bg-white/20" animate={false} />
          <SkeletonBase className="h-4 w-48 bg-white/20" animate={false} />
        </div>
        <SkeletonBase className="h-10 w-10 bg-white/20" animate={false} />
      </div>
    </div>

    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations de base */}
          <div className="romulus-card">
            <div className="flex items-center space-x-2 mb-4">
              <SkeletonBase className="h-5 w-5" />
              <SkeletonBase className="h-5 w-32" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <SkeletonBase className="h-6 w-16" />
                <SkeletonBase className="h-4 w-24" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <SkeletonBase className="h-4 w-4" />
                    <SkeletonBase className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Parties */}
          <div className="romulus-card">
            <div className="flex items-center space-x-2 mb-4">
              <SkeletonBase className="h-5 w-5" />
              <SkeletonBase className="h-5 w-20" />
            </div>
            <div className="flex flex-wrap gap-2">
              {[...Array(3)].map((_, i) => (
                <SkeletonBase key={i} className="h-6 w-24" />
              ))}
            </div>
          </div>

          {/* Résumé */}
          <div className="romulus-card">
            <div className="flex items-center space-x-2 mb-4">
              <SkeletonBase className="h-5 w-5" />
              <SkeletonBase className="h-5 w-32" />
            </div>
            <div className="space-y-2">
              <SkeletonBase className="h-4 w-full" />
              <SkeletonBase className="h-4 w-5/6" />
              <SkeletonBase className="h-4 w-4/6" />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="romulus-card h-full">
            <div className="flex items-center space-x-2 mb-4">
              <SkeletonBase className="h-5 w-5" />
              <SkeletonBase className="h-5 w-20" />
            </div>
            <div className="text-center py-8">
              <SkeletonBase className="h-10 w-32 mx-auto mb-4" />
              <SkeletonBase className="h-4 w-24 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Skeleton pour la liste des cas récents
export const RecentCasesSkeleton = ({ count = 4 }) => (
  <div className="space-y-3">
    {[...Array(count)].map((_, index) => (
      <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <SkeletonBase className="h-5 w-16" />
            <SkeletonBase className="h-3 w-20" />
          </div>
          <div className="flex items-center space-x-1">
            <SkeletonBase className="h-2 w-2 rounded-full" />
            <SkeletonBase className="h-2 w-2 rounded-full" />
          </div>
        </div>
        <SkeletonBase className="h-4 w-3/4 mb-1" />
        <div className="space-y-1">
          <SkeletonBase className="h-3 w-full" />
          <SkeletonBase className="h-3 w-2/3" />
        </div>
        <div className="mt-2 flex items-center space-x-2">
          <SkeletonBase className="h-3 w-3" />
          <SkeletonBase className="h-3 w-32" />
        </div>
      </div>
    ))}
  </div>
);

export default SkeletonBase;