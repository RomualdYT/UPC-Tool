import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';

// Barre de progression linéaire
export const ProgressBar = ({ 
  progress = 0, 
  className = '', 
  showPercent = false, 
  color = 'orange',
  animated = true,
  size = 'md'
}) => {
  const colorClasses = {
    orange: 'bg-gradient-to-r from-orange-500 to-orange-600',
    blue: 'bg-gradient-to-r from-blue-500 to-blue-600',
    green: 'bg-gradient-to-r from-green-500 to-green-600',
    purple: 'bg-gradient-to-r from-purple-500 to-purple-600',
    red: 'bg-gradient-to-r from-red-500 to-red-600'
  };

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
    xl: 'h-4'
  };

  return (
    <div className={`w-full ${className}`}>
      <div className={`bg-gray-200 dark:bg-gray-700 rounded-full ${sizeClasses[size]}`}>
        <motion.div
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-300`}
          initial={animated ? { width: 0 } : { width: `${progress}%` }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      {showPercent && (
        <div className="mt-1 text-right">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
};

// Indicateur de progression circulaire
export const CircularProgress = ({ 
  progress = 0, 
  size = 80, 
  strokeWidth = 6, 
  color = 'orange',
  showPercent = true,
  className = '' 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const colorClasses = {
    orange: 'stroke-orange-500',
    blue: 'stroke-blue-500',
    green: 'stroke-green-500',
    purple: 'stroke-purple-500',
    red: 'stroke-red-500'
  };

  return (
    <div className={`relative ${className}`}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Cercle de fond */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Cercle de progression */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={colorClasses[color]}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </svg>
      {showPercent && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
};

// Indicateur de statut avec icône
export const StatusIndicator = ({ 
  status = 'idle', 
  message = '', 
  className = '',
  showIcon = true,
  animated = true 
}) => {
  const statusConfig = {
    idle: {
      icon: Clock,
      color: 'text-gray-500 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      borderColor: 'border-gray-300 dark:border-gray-600'
    },
    loading: {
      icon: RefreshCw,
      color: 'text-blue-500 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-300 dark:border-blue-600',
      animate: true
    },
    success: {
      icon: CheckCircle,
      color: 'text-green-500 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-300 dark:border-green-600'
    },
    error: {
      icon: AlertCircle,
      color: 'text-red-500 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-300 dark:border-red-600'
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${config.bgColor} ${config.borderColor} ${className}`}>
      {showIcon && (
        <Icon 
          className={`h-4 w-4 ${config.color} ${config.animate && animated ? 'animate-spin' : ''}`}
        />
      )}
      {message && (
        <span className={`text-sm font-medium ${config.color}`}>
          {message}
        </span>
      )}
    </div>
  );
};

// Indicateur de chargement par étapes
export const StepProgress = ({ 
  steps = [], 
  currentStep = 0, 
  className = '',
  orientation = 'horizontal' 
}) => {
  const isHorizontal = orientation === 'horizontal';
  
  return (
    <div className={`${className}`}>
      <div className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} ${isHorizontal ? 'items-center' : 'items-start'}`}>
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex ${isHorizontal ? 'items-center' : 'items-start'} ${
              index < steps.length - 1 ? (isHorizontal ? 'flex-1' : 'mb-4') : ''
            }`}
          >
            {/* Icône de l'étape */}
            <div className="flex-shrink-0 relative">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  index < currentStep
                    ? 'bg-green-500 text-white'
                    : index === currentStep
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
            </div>
            
            {/* Texte de l'étape */}
            <div className={`${isHorizontal ? 'ml-2' : 'ml-3 mt-1'}`}>
              <p className={`text-sm font-medium ${
                index <= currentStep 
                  ? 'text-gray-900 dark:text-gray-100' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {step.title}
              </p>
              {step.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {step.description}
                </p>
              )}
            </div>
            
            {/* Ligne de connexion */}
            {index < steps.length - 1 && (
              <div className={`${
                isHorizontal 
                  ? 'flex-1 h-0.5 mx-4 mt-4' 
                  : 'w-0.5 h-8 ml-4 mt-2'
              } ${
                index < currentStep 
                  ? 'bg-green-500' 
                  : 'bg-gray-300 dark:bg-gray-600'
              } transition-all duration-300`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Indicateur de synchronisation en temps réel
export const SyncIndicator = ({ 
  syncing = false, 
  lastSync = null, 
  className = '',
  detailed = false 
}) => {
  const formatLastSync = (timestamp) => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-1">
        <div className={`w-2 h-2 rounded-full ${
          syncing 
            ? 'bg-blue-500 animate-pulse' 
            : lastSync 
            ? 'bg-green-500' 
            : 'bg-gray-400'
        }`} />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {syncing ? 'Syncing...' : 'Synced'}
        </span>
      </div>
      
      {detailed && lastSync && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatLastSync(lastSync)}
        </span>
      )}
    </div>
  );
};

// Indicateur de progression avec étapes multiples
export const MultiStepProgress = ({ 
  steps = [], 
  currentStep = 0, 
  progress = 0,
  className = '' 
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barre de progression globale */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {Math.round(progress)}%
          </span>
        </div>
        <ProgressBar progress={progress} animated={true} />
      </div>
      
      {/* Étape actuelle */}
      {steps[currentStep] && (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
            <RefreshCw className="h-4 w-4 text-white animate-spin" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {steps[currentStep].title}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {steps[currentStep].description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default {
  ProgressBar,
  CircularProgress,
  StatusIndicator,
  StepProgress,
  SyncIndicator,
  MultiStepProgress
};