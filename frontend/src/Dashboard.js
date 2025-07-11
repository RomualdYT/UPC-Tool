import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Building2, 
  FileText, 
  Filter,
  Search,
  RefreshCw,
  Calendar,
  Star,
  MessageSquare,
  ChevronRight,
  ArrowRight,
  Book
} from 'lucide-react';
import { format } from 'date-fns';
import { useData } from './contexts/DataContext';
import { useTranslation } from 'react-i18next';

const Dashboard = ({ onNavigateToData, onNavigateToUPCCode }) => {
  const { t } = useTranslation();
  const { 
    allCases, 
    stats, 
    loading, 
    syncing,
    fetchAllCases,
    setNotification 
  } = useData();

  const [refreshing, setRefreshing] = useState(false);

  // Charger les données si elles ne sont pas encore chargées
  useEffect(() => {
    if (allCases.length === 0 && !loading) {
      fetchAllCases();
    }
  }, [allCases.length, loading, fetchAllCases]);

  // Fonction pour actualiser les données
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchAllCases();
      setNotification({
        message: t('notifications.dataUpdated'),
        type: 'success',
        duration: 3000
      });
    } catch (error) {
      setNotification({
        message: t('notifications.updateError'),
        type: 'error',
        duration: 4000
      });
    } finally {
      setRefreshing(false);
    }
  };



  // Calculs avancés pour les statistiques temps réel
  const advancedStats = useMemo(() => {
    if (!allCases || allCases.length === 0) {
      return {
        totalCases: 0,
        recentGrowth: 0,
        mostActiveDivision: 'N/A',
        averageCasesPerMonth: 0,
        topLanguage: 'N/A',
        commentedCases: 0,
        importantCases: 0,
        completionRate: 0
      };
    }

    // Calcul de la croissance récente (30 derniers jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentCases = allCases.filter(c => {
      try {
        return new Date(c.date) >= thirtyDaysAgo;
      } catch {
        return false;
      }
    });

    // Division la plus active
    const divisionCounts = allCases.reduce((acc, c) => {
      acc[c.court_division] = (acc[c.court_division] || 0) + 1;
      return acc;
    }, {});
    
    const mostActiveDivision = Object.entries(divisionCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

    // Moyenne par mois
    const monthCounts = allCases.reduce((acc, c) => {
      try {
        const monthKey = format(new Date(c.date), 'yyyy-MM');
        acc[monthKey] = (acc[monthKey] || 0) + 1;
      } catch {}
      return acc;
    }, {});
    
    const averageCasesPerMonth = Object.keys(monthCounts).length > 0 
      ? Math.round(allCases.length / Object.keys(monthCounts).length)
      : 0;

    // Langue la plus utilisée
    const languageCounts = allCases.reduce((acc, c) => {
      acc[c.language_of_proceedings] = (acc[c.language_of_proceedings] || 0) + 1;
      return acc;
    }, {});
    
    const topLanguage = Object.entries(languageCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

    // Cas avec commentaires administratifs
    const commentedCases = allCases.filter(c => c.admin_summary).length;
    
    // Cas importants (avec apports)
    const importantCases = allCases.filter(c => c.apports && c.apports.length > 0).length;

    // Taux de complétion (cas avec documents)
    const casesWithDocs = allCases.filter(c => c.documents && c.documents.length > 0).length;
    const completionRate = allCases.length > 0 ? Math.round((casesWithDocs / allCases.length) * 100) : 0;

    return {
      totalCases: allCases.length,
      recentGrowth: recentCases.length,
      mostActiveDivision,
      averageCasesPerMonth,
      topLanguage,
      commentedCases,
      importantCases,
      completionRate
    };
  }, [allCases]);

  // Données pour les graphiques en temps réel
  const chartData = useMemo(() => {
    if (!allCases || allCases.length === 0) {
      return {
        typeData: [],
        divisionData: [],
        monthData: [],
        languageData: []
      };
    }

    // Données par type
    const typeStats = allCases.reduce((acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + 1;
      return acc;
    }, {});

    const typeData = Object.entries(typeStats).map(([type, count], index) => ({
      label: type,
      value: count,
      percentage: Math.round((count / allCases.length) * 100),
      color: index === 0 ? '#f97316' : '#10b981'
    }));

    // Données par division
    const divisionStats = allCases.reduce((acc, c) => {
      acc[c.court_division] = (acc[c.court_division] || 0) + 1;
      return acc;
    }, {});

    const divisionData = Object.entries(divisionStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([division, count]) => ({
        label: division,
        value: count
      }));

    // Données temporelles (6 derniers mois)
    const monthStats = allCases.reduce((acc, c) => {
      try {
        const monthKey = format(new Date(c.date), 'yyyy-MM');
        acc[monthKey] = (acc[monthKey] || 0) + 1;
      } catch {}
      return acc;
    }, {});

    const monthData = Object.entries(monthStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, count]) => ({
        label: format(new Date(month + '-01'), 'MMM yyyy'),
        value: count
      }));

    // Données par langue
    const languageStats = allCases.reduce((acc, c) => {
      acc[c.language_of_proceedings] = (acc[c.language_of_proceedings] || 0) + 1;
      return acc;
    }, {});

    const languageData = Object.entries(languageStats).map(([lang, count]) => ({
      label: lang,
      value: count,
      percentage: Math.round((count / allCases.length) * 100)
    }));

    return { typeData, divisionData, monthData, languageData };
  }, [allCases]);

  const StatCard = ({ title, value, subtitle, icon: Icon, color = 'orange', trend, onClick }) => {
    const colorClasses = {
      blue: 'bg-gradient-to-r from-blue-500 to-blue-600',
      green: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      purple: 'bg-gradient-to-r from-purple-500 to-purple-600',
      orange: 'bg-gradient-to-r from-orange-500 to-orange-600',
      red: 'bg-gradient-to-r from-red-500 to-red-600',
      indigo: 'bg-gradient-to-r from-indigo-500 to-indigo-600'
    };
    
    return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`${colorClasses[color] || colorClasses.orange} text-white rounded-xl shadow-lg p-6 cursor-pointer`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm opacity-90 font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm opacity-80 mt-1">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className="flex items-center mt-2">
              <TrendingUp className={`h-4 w-4 ${trend >= 0 ? 'text-green-200' : 'text-red-200'}`} />
              <span className="text-sm ml-1 font-medium">
                {trend >= 0 ? '+' : ''}{trend}
              </span>
            </div>
          )}
        </div>
        <div className="p-3 bg-white/20 rounded-lg">
          <Icon className="h-8 w-8" />
        </div>
      </div>
    </motion.div>
    );
  };

  const ChartCard = ({ title, children, className = '', action }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-lg p-6 border border-gray-100 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {action && (
          <button
            onClick={action.onClick}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center space-x-1"
          >
            <span>{action.label}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
      {children}
    </motion.div>
  );

  const SimpleBarChart = ({ data, height = 200 }) => (
    <div className="space-y-3" style={{ height }}>
      {data.map((item, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className="w-20 text-sm text-gray-600 truncate">{item.label}</div>
          <div className="flex-1 bg-gray-200 rounded-full h-6">
            <div
              className="bg-gradient-to-r from-orange-400 to-orange-600 h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
              style={{ width: `${(item.value / Math.max(...data.map(d => d.value))) * 100}%` }}
            >
              <span className="text-white text-xs font-medium">{item.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const RecentCaseCard = ({ case_item }) => (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-orange-300 transition-colors cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">
            {case_item.type}
          </span>
          <span className="text-xs text-gray-500">
            {format(new Date(case_item.date), 'dd MMM yyyy')}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          {case_item.admin_summary && (
            <div className="w-2 h-2 bg-blue-500 rounded-full" title="Commenté" />
          )}
          {case_item.apports && case_item.apports.length > 0 && (
            <div className="w-2 h-2 bg-red-500 rounded-full" title="Important" />
          )}
        </div>
      </div>
      <h4 className="font-medium text-gray-900 text-sm mb-1">{case_item.reference}</h4>
      <p className="text-xs text-gray-600 line-clamp-2">{case_item.summary}</p>
      <div className="mt-2 text-xs text-gray-500 flex items-center space-x-2">
        <Building2 className="h-3 w-3" />
        <span>{case_item.court_division}</span>
      </div>
    </div>
  );

  if (loading && allCases.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-dots mb-4">
            <div></div>
            <div></div>
            <div></div>
          </div>
          <p className="text-gray-600">Chargement des données UPC...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4 font-display">
            {t('dashboard.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            {t('dashboard.subtitle')}
          </p>
          
          {/* Actions rapides */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="romulus-btn-secondary flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{t('dashboard.refresh')}</span>
            </button>
            

            
            <button
              onClick={onNavigateToData}
              className="romulus-btn-secondary flex items-center space-x-2"
            >
              <Search className="h-4 w-4" />
              <span>{t('dashboard.exploreData')}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            
            <button
              onClick={onNavigateToUPCCode}
              className="romulus-btn-primary flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
            >
              <Book className="h-4 w-4" />
              <span>{t('dashboard.upcCode')}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title={t('dashboard.totalCases')}
            value={advancedStats.totalCases.toLocaleString()}
            subtitle={t('dashboard.decisionsAndOrders')}
            icon={FileText}
            color="blue"
          />
          <StatCard
            title={t('dashboard.newCases')}
            value={advancedStats.recentGrowth}
            subtitle={t('dashboard.last30Days')}
            icon={TrendingUp}
            color="green"
            trend={advancedStats.recentGrowth}
          />
          <StatCard
            title={t('dashboard.activeDivision')}
            value={advancedStats.mostActiveDivision.split('(')[0].trim()}
            subtitle={t('dashboard.mostActivity')}
            icon={Building2}
            color="purple"
          />
          <StatCard
            title={t('dashboard.monthlyAverage')}
            value={advancedStats.averageCasesPerMonth}
            subtitle={t('dashboard.casesPerMonth')}
            icon={Calendar}
            color="orange"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Cases by Type */}
          <ChartCard 
            title={t('dashboard.caseTypeDistribution')}
            action={{ label: t('dashboard.viewDetails'), onClick: () => {} }}
          >
            <div className="space-y-4">
              {chartData.typeData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium text-gray-900">{item.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{item.value}</div>
                    <div className="text-sm text-gray-500">{item.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* Cases by Division */}
          <ChartCard 
            title={t('dashboard.topDivisions')}
            action={{ label: t('dashboard.viewAll'), onClick: () => {} }}
          >
            <SimpleBarChart data={chartData.divisionData} />
          </ChartCard>
        </div>

        {/* Timeline and Recent Cases */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Timeline Chart */}
          <ChartCard title={t('dashboard.evolution6Months')}>
            <SimpleBarChart data={chartData.monthData} height={300} />
          </ChartCard>

          {/* Recent Cases */}
          <ChartCard 
            title={t('dashboard.recentCases')}
            action={{ label: t('dashboard.viewAllCases'), onClick: () => {} }}
          >
            <div className="space-y-3">
              {stats.recentCases.slice(0, 4).map((case_item, index) => (
                <RecentCaseCard key={index} case_item={case_item} />
              ))}
            </div>
          </ChartCard>
        </div>

        {/* Advanced Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <ChartCard title={t('dashboard.advancedStats')}>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>{t('dashboard.commentedCases')}</span>
                </span>
                <span className="font-bold text-blue-600">{advancedStats.commentedCases}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center space-x-2">
                  <Star className="h-4 w-4" />
                  <span>{t('dashboard.importantCases')}</span>
                </span>
                <span className="font-bold text-red-600">{advancedStats.importantCases}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>{t('dashboard.completionRate')}</span>
                </span>
                <span className="font-bold text-green-600">{advancedStats.completionRate}%</span>
              </div>
            </div>
          </ChartCard>

          <ChartCard title={t('dashboard.languageDistribution')}>
            <div className="space-y-3">
              {chartData.languageData.slice(0, 4).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-600">{item.label}</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{item.value}</span>
                    <span className="text-sm text-gray-500">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title={t('dashboard.quickActions')}>
            <div className="space-y-3">
              <button

                className="w-full flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Search className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-orange-800">{t('dashboard.searchCases')}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-orange-600" />
              </button>
              

              
              <button className="w-full flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">{t('dashboard.exportStats')}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-green-600" />
              </button>
            </div>
          </ChartCard>
        </div>

        {/* Status Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${syncing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
                <span className="text-sm font-medium text-gray-700">
                  {syncing ? t('dashboard.syncingInProgress') : t('dashboard.systemOperational')}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {t('dashboard.lastUpdate')}: {format(new Date(), 'dd/MM/yyyy HH:mm')}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {allCases.length} {t('dashboard.decisionsLoaded')}
              </span>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="text-orange-600 hover:text-orange-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;