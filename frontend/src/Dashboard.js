import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Building2, 
  FileText, 
  Globe,
  ArrowRight,
  Download,
  Filter,
  Search,
  Gavel
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const Dashboard = ({ onNavigateToData }) => {
  const [stats, setStats] = useState({
    totalCases: 0,
    casesByType: {},
    casesByDivision: {},
    casesByLanguage: {},
    casesByMonth: {},
    recentCases: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  useEffect(() => {
    fetchDashboardStats();
  }, [selectedPeriod]);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/cases?limit=1000`);
      const cases = response.data;
      
      // Calculer les statistiques
      const stats = calculateStats(cases);
      setStats(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (cases) => {
    const stats = {
      totalCases: cases.length,
      casesByType: {},
      casesByDivision: {},
      casesByLanguage: {},
      casesByMonth: {},
      recentCases: cases.slice(0, 5)
    };

    cases.forEach(case_item => {
      // Par type
      stats.casesByType[case_item.type] = (stats.casesByType[case_item.type] || 0) + 1;
      
      // Par division
      stats.casesByDivision[case_item.court_division] = (stats.casesByDivision[case_item.court_division] || 0) + 1;
      
      // Par langue
      stats.casesByLanguage[case_item.language_of_proceedings] = (stats.casesByLanguage[case_item.language_of_proceedings] || 0) + 1;
      
      // Par mois
      const date = new Date(case_item.date);
      const monthKey = format(date, 'yyyy-MM');
      stats.casesByMonth[monthKey] = (stats.casesByMonth[monthKey] || 0) + 1;
    });

    return stats;
  };

  const getChartData = () => {
    const typeData = Object.entries(stats.casesByType).map(([type, count]) => ({
      label: type,
      value: count,
      color: getRandomColor()
    }));

    const divisionData = Object.entries(stats.casesByDivision).map(([division, count]) => ({
      label: division,
      value: count,
      color: getRandomColor()
    }));

    const monthData = Object.entries(stats.casesByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, count]) => ({
        label: format(new Date(month + '-01'), 'MMM yyyy'),
        value: count
      }));

    return { typeData, divisionData, monthData };
  };

  const getRandomColor = () => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const StatCard = ({ title, value, icon: Icon, color = 'orange', trend }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              <TrendingUp className={`h-4 w-4 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`} />
              <span className={`text-sm ml-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </motion.div>
  );

  const ChartCard = ({ title, children, className = '' }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-lg p-6 border border-gray-100 ${className}`}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </motion.div>
  );

  const SimpleBarChart = ({ data, height = 200 }) => (
    <div className="space-y-2" style={{ height }}>
      {data.map((item, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className="w-24 text-sm text-gray-600 truncate">{item.label}</div>
          <div className="flex-1 bg-gray-200 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-orange-400 to-orange-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${(item.value / Math.max(...data.map(d => d.value))) * 100}%` }}
            />
          </div>
          <div className="w-12 text-sm font-medium text-gray-900 text-right">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );

  const SimplePieChart = ({ data, height = 200 }) => (
    <div className="space-y-3" style={{ height }}>
      {data.map((item, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <div className="flex-1 text-sm text-gray-600">{item.label}</div>
          <div className="text-sm font-medium text-gray-900">{item.value}</div>
        </div>
      ))}
    </div>
  );

  const RecentCaseCard = ({ case_item }) => (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">
            {case_item.type}
          </span>
          <span className="text-xs text-gray-500">
            {format(new Date(case_item.date), 'dd MMM yyyy')}
          </span>
        </div>
        <Building2 className="h-4 w-4 text-gray-400" />
      </div>
      <h4 className="font-medium text-gray-900 text-sm mb-1">{case_item.reference}</h4>
      <p className="text-xs text-gray-600 line-clamp-2">{case_item.summary}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center">
        <div className="loading-dots">
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    );
  }

  const { typeData, divisionData, monthData } = getChartData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="gradient-primary shadow-orange-lg"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white font-display">
                UPC Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={onNavigateToData}
                className="bg-white/20 text-white px-4 py-2 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-colors flex items-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                <span>Voir les données</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4 font-display">
            Tableau de bord UPC
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Analysez les tendances et statistiques des décisions de la Cour unifiée des brevets
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total des cas"
            value={stats.totalCases}
            icon={FileText}
            color="blue"
          />
          <StatCard
            title="Divisions actives"
            value={Object.keys(stats.casesByDivision).length}
            icon={Building2}
            color="green"
          />
          <StatCard
            title="Types de cas"
            value={Object.keys(stats.casesByType).length}
            icon={Gavel}
            color="purple"
          />
          <StatCard
            title="Langues"
            value={Object.keys(stats.casesByLanguage).length}
            icon={Globe}
            color="orange"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Cases by Type */}
          <ChartCard title="Répartition par type de cas">
            <SimplePieChart data={typeData} />
          </ChartCard>

          {/* Cases by Division */}
          <ChartCard title="Répartition par division">
            <SimpleBarChart data={divisionData} />
          </ChartCard>
        </div>

        {/* Timeline and Recent Cases */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Timeline Chart */}
          <ChartCard title="Évolution mensuelle">
            <SimpleBarChart data={monthData} height={300} />
          </ChartCard>

          {/* Recent Cases */}
          <ChartCard title="Cas récents">
            <div className="space-y-3">
              {stats.recentCases.map((case_item, index) => (
                <RecentCaseCard key={index} case_item={case_item} />
              ))}
            </div>
          </ChartCard>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12"
        >
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Actions rapides</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={onNavigateToData}
                className="flex items-center justify-center space-x-3 p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <Search className="h-5 w-5 text-orange-600" />
                <span className="font-medium text-orange-800">Rechercher des cas</span>
              </button>
              
              <button className="flex items-center justify-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                <Filter className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-800">Filtrer les données</span>
              </button>
              
              <button className="flex items-center justify-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                <Download className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Exporter les stats</span>
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard; 