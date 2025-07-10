import React, { useState, useMemo } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  getSortedRowModel, 
  getFilteredRowModel, 
  getPaginationRowModel,
  flexRender
} from '@tanstack/react-table';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  ChevronDown, 
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  FileText,
  Building2,
  Tag,
  BarChart3,
  TrendingUp,
  Star,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { DynamicChart } from './ChartComponents';

// Composant de filtre global
const GlobalFilter = ({ globalFilter, setGlobalFilter }) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
      <input
        type="text"
        value={globalFilter || ''}
        onChange={e => setGlobalFilter(e.target.value)}
        placeholder="Rechercher dans toutes les colonnes..."
        className="w-full pl-10 pr-4 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
      />
    </div>
  );
};



// Composant de statistiques
const TableStats = ({ data, filteredData }) => {
  const stats = useMemo(() => {
    const total = data.length;
    const filtered = filteredData.length;
    const courtDivisions = [...new Set(data.map(item => item.court_division))].length;
    const caseTypes = [...new Set(data.map(item => item.type))].length;
    
    // Statistiques par année
    const yearStats = data.reduce((acc, item) => {
      const year = new Date(item.date).getFullYear();
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {});
    
    const mostRecentYear = Math.max(...Object.keys(yearStats).map(Number));
    const oldestYear = Math.min(...Object.keys(yearStats).map(Number));
    
    return {
      total,
      filtered,
      courtDivisions,
      caseTypes,
      yearStats,
      mostRecentYear,
      oldestYear
    };
  }, [data, filteredData]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <FileText className="h-8 w-8 opacity-80" />
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4 rounded-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Affichés</p>
            <p className="text-2xl font-bold">{stats.filtered}</p>
          </div>
          <BarChart3 className="h-8 w-8 opacity-80" />
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Divisions</p>
            <p className="text-2xl font-bold">{stats.courtDivisions}</p>
          </div>
          <Building2 className="h-8 w-8 opacity-80" />
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Types</p>
            <p className="text-2xl font-bold">{stats.caseTypes}</p>
          </div>
          <Tag className="h-8 w-8 opacity-80" />
        </div>
      </motion.div>
    </div>
  );
};

// Composant de visualisation des données
const DataVisualization = ({ data }) => {
  const [chartType, setChartType] = useState('bar');
  
  const chartData = useMemo(() => {
    // Données pour le graphique par division
    const divisionStats = data.reduce((acc, item) => {
      acc[item.court_division] = (acc[item.court_division] || 0) + 1;
      return acc;
    }, {});
    
    // Données pour le graphique par type
    const typeStats = data.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {});
    
    // Données pour le graphique temporel
    const timeStats = data.reduce((acc, item) => {
      const year = new Date(item.date).getFullYear();
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {});
    
    // Données pour le graphique multi-séries (par division et par année)
    const divisionTimeStats = {};
    data.forEach(item => {
      const year = new Date(item.date).getFullYear();
      const division = item.court_division;
      if (!divisionTimeStats[division]) {
        divisionTimeStats[division] = {};
      }
      divisionTimeStats[division][year] = (divisionTimeStats[division][year] || 0) + 1;
    });
    
    const years = Object.keys(timeStats).sort();
    const multilineData = Object.keys(divisionTimeStats).map(division => ({
      label: division,
      data: years.map(year => divisionTimeStats[division][year] || 0)
    }));
    
    return {
      divisions: {
        labels: Object.keys(divisionStats),
        data: Object.values(divisionStats),
        backgroundColor: [
          '#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444',
          '#f59e0b', '#06b6d4', '#84cc16', '#f43f5e', '#6366f1'
        ]
      },
      types: {
        labels: Object.keys(typeStats),
        data: Object.values(typeStats),
        backgroundColor: [
          '#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'
        ]
      },
      timeline: {
        labels: years,
        data: years.map(year => timeStats[year])
      },
      multiline: {
        labels: years,
        datasets: multilineData
      }
    };
  }, [data]);

  return (
    <div className="romulus-card mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-orange-600" />
          <span>Visualisation des données</span>
        </h3>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              chartType === 'bar' 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Barres
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              chartType === 'pie' 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Secteurs
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              chartType === 'line' 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Ligne
          </button>
          <button
            onClick={() => setChartType('doughnut')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              chartType === 'doughnut' 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Anneau
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-4">Par division</h4>
          <DynamicChart 
            type={chartType} 
            data={chartData.divisions} 
            title="Décisions par division"
            height={300}
          />
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-4">Par type de cas</h4>
          <DynamicChart 
            type={chartType} 
            data={chartData.types} 
            title="Décisions par type"
            height={300}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-4">Évolution temporelle</h4>
          <DynamicChart 
            type="line" 
            data={chartData.timeline} 
            title="Décisions par année"
            height={300}
          />
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-4">Par division et année</h4>
          <DynamicChart 
            type="multiline" 
            data={chartData.multiline} 
            title="Évolution par division"
            height={300}
          />
        </div>
      </div>
    </div>
  );
};

const DataTable = ({ data, onViewDetails, onExport }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);

  const columns = useMemo(() => [
    {
      header: 'Date',
      accessorKey: 'date',
      cell: ({ getValue }) => {
        const value = getValue();
        try {
          return format(new Date(value), 'dd/MM/yyyy');
        } catch {
          return value;
        }
      }
    },
    {
      header: 'Référence',
      accessorKey: 'reference'
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: ({ getValue }) => {
        const value = getValue();
        return (
          <span className={`romulus-badge ${value === 'Order' ? 'romulus-badge-primary' : 'romulus-badge-secondary'}`}>
            {value}
          </span>
        );
      }
    },
    {
      header: 'Division',
      accessorKey: 'court_division',
      cell: ({ getValue }) => {
        const value = getValue();
        return (
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4 text-gray-400" />
            <span>{value}</span>
          </div>
        );
      }
    },
    {
      header: 'Parties',
      accessorKey: 'parties',
      cell: ({ getValue }) => {
        const value = getValue();
        return (
          <div className="max-w-xs">
            {Array.isArray(value) ? (
              <div className="flex flex-wrap gap-1">
                {value.slice(0, 2).map((party, idx) => (
                  <span key={idx} className="romulus-badge-secondary text-xs">
                    {party}
                  </span>
                ))}
                {value.length > 2 && (
                  <span className="text-xs text-gray-500">+{value.length - 2}</span>
                )}
              </div>
            ) : (
              <span className="text-sm">{value}</span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Résumé',
      accessorKey: 'summary',
      cell: ({ getValue }) => {
        const value = getValue();
        return (
          <div className="max-w-xs">
            <p className="text-sm text-gray-600 line-clamp-2">{value}</p>
          </div>
        );
      }
    },
    {
      header: 'Admin',
      accessorKey: 'admin_status',
      cell: ({ row }) => {
        const case_item = row.original;
        const hasApports = case_item.apports && case_item.apports.length > 0;
        const hasSummary = case_item.admin_summary;
        
        if (!hasApports && !hasSummary) {
          return <span className="text-gray-400 text-xs">-</span>;
        }
        
        return (
          <div className="flex flex-wrap gap-1">
            {hasApports && (
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full flex items-center space-x-1">
                <Star className="h-3 w-3" />
                <span>Important</span>
              </span>
            )}
            {hasSummary && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full flex items-center space-x-1">
                <MessageSquare className="h-3 w-3" />
                <span>Commenté</span>
              </span>
            )}
          </div>
        );
      },
      enableSorting: false
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: ({ getValue, row }) => {
        const value = getValue();
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => onViewDetails(value)}
              className="p-1 text-orange-600 hover:text-orange-700 transition-colors"
              title="Voir les détails"
            >
              <Eye className="h-4 w-4" />
            </button>
            {row.original.documents && row.original.documents.length > 0 && (
              <a
                href={row.original.documents[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                title="Télécharger"
              >
                <Download className="h-4 w-4" />
              </a>
            )}
          </div>
        );
      },
      enableSorting: false
    }
  ], [onViewDetails]);

  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    globalFilterFn: 'includesString',
    state: {
      globalFilter,
      sorting,
      pagination,
    },
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });



  return (
    <div className="space-y-6">
      {/* Contrôles */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowVisualization(!showVisualization)}
            className="romulus-btn-secondary flex items-center space-x-2"
          >
            {showVisualization ? <BarChart3 className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
            <span>{showVisualization ? 'Masquer' : 'Visualiser'}</span>
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="romulus-btn-secondary flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filtres</span>
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <GlobalFilter globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} />
          
          <button
            onClick={() => onExport && onExport(table.getFilteredRowModel().rows.map(row => row.original))}
            className="romulus-btn-primary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      {/* Visualisation */}
      <AnimatePresence>
        {showVisualization && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DataVisualization data={data} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Statistiques */}
      <TableStats data={data} filteredData={table.getFilteredRowModel().rows.map(row => row.original)} />

      {/* Filtres par colonne */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="romulus-card"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtres par colonne</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {table.getAllColumns()
                .filter(column => column.getCanFilter())
                .map(column => (
                  <div key={column.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {column.columnDef.header}
                    </label>
                    <input
                      type="text"
                      value={column.getFilterValue() || ''}
                      onChange={e => column.setFilterValue(e.target.value)}
                      placeholder={`Filtrer ${column.columnDef.header}...`}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tableau */}
      <div className="romulus-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-orange-600 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                        {{
                          asc: <ChevronUp className="h-4 w-4" />,
                          desc: <ChevronDown className="h-4 w-4" />,
                        }[header.column.getIsSorted()] ?? <div className="w-4 h-4" />}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-gray-200 hover:bg-orange-50 transition-colors"
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="romulus-btn-secondary px-2 py-1 text-sm disabled:opacity-50"
            >
              {'<<'}
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="romulus-btn-secondary px-2 py-1 text-sm disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="romulus-btn-secondary px-2 py-1 text-sm disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="romulus-btn-secondary px-2 py-1 text-sm disabled:opacity-50"
            >
              {'>>'}
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Page{' '}
              <strong>
                {table.getState().pagination.pageIndex + 1} sur {table.getPageCount()}
              </strong>
            </span>
            
            <select
              value={table.getState().pagination.pageSize}
              onChange={e => table.setPageSize(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              {[10, 20, 30, 40, 50].map(pageSize => (
                <option key={pageSize} value={pageSize}>
                  Afficher {pageSize}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTable; 