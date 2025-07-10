import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Configuration commune pour les graphiques
const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        padding: 20,
        usePointStyle: true,
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: 'white',
      bodyColor: 'white',
      borderColor: '#f97316',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true
    }
  }
};

// Graphique en barres
export const BarChart = ({ data, title, height = 300 }) => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: title,
        data: data.data,
        backgroundColor: data.backgroundColor || [
          '#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444',
          '#f59e0b', '#06b6d4', '#84cc16', '#f43f5e', '#6366f1'
        ],
        borderColor: data.borderColor || [
          '#ea580c', '#059669', '#2563eb', '#7c3aed', '#dc2626',
          '#d97706', '#0891b2', '#65a30d', '#e11d48', '#4f46e5'
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }
    ]
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        },
        color: '#374151'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12
          }
        }
      }
    }
  };

  return (
    <div style={{ height }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

// Graphique en secteurs
export const PieChart = ({ data, title, height = 300 }) => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        data: data.data,
        backgroundColor: data.backgroundColor || [
          '#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444',
          '#f59e0b', '#06b6d4', '#84cc16', '#f43f5e', '#6366f1'
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 4
      }
    ]
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        },
        color: '#374151'
      }
    }
  };

  return (
    <div style={{ height }}>
      <Pie data={chartData} options={options} />
    </div>
  );
};

// Graphique en anneau
export const DoughnutChart = ({ data, title, height = 300 }) => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        data: data.data,
        backgroundColor: data.backgroundColor || [
          '#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444',
          '#f59e0b', '#06b6d4', '#84cc16', '#f43f5e', '#6366f1'
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 4
      }
    ]
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        },
        color: '#374151'
      }
    }
  };

  return (
    <div style={{ height }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

// Graphique linéaire
export const LineChart = ({ data, title, height = 300 }) => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: title,
        data: data.data,
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#f97316',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        },
        color: '#374151'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12
          }
        }
      }
    }
  };

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

// Graphique multi-séries
export const MultiLineChart = ({ data, title, height = 300 }) => {
  const colors = [
    '#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444',
    '#f59e0b', '#06b6d4', '#84cc16', '#f43f5e', '#6366f1'
  ];

  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map((dataset, index) => ({
      label: dataset.label,
      data: dataset.data,
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length] + '20',
      borderWidth: 2,
      fill: false,
      tension: 0.4,
      pointBackgroundColor: colors[index % colors.length],
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6
    }))
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        },
        color: '#374151'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12
          }
        }
      }
    }
  };

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

// Graphique en barres empilées
export const StackedBarChart = ({ data, title, height = 300 }) => {
  const colors = [
    '#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444',
    '#f59e0b', '#06b6d4', '#84cc16', '#f43f5e', '#6366f1'
  ];

  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map((dataset, index) => ({
      label: dataset.label,
      data: dataset.data,
      backgroundColor: colors[index % colors.length],
      borderColor: colors[index % colors.length],
      borderWidth: 1,
      borderRadius: 4
    }))
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        },
        color: '#374151'
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12
          }
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12
          }
        }
      }
    }
  };

  return (
    <div style={{ height }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

// Composant de graphique dynamique
export const DynamicChart = ({ type, data, title, height = 300 }) => {
  switch (type) {
    case 'bar':
      return <BarChart data={data} title={title} height={height} />;
    case 'pie':
      return <PieChart data={data} title={title} height={height} />;
    case 'doughnut':
      return <DoughnutChart data={data} title={title} height={height} />;
    case 'line':
      return <LineChart data={data} title={title} height={height} />;
    case 'multiline':
      return <MultiLineChart data={data} title={title} height={height} />;
    case 'stacked':
      return <StackedBarChart data={data} title={title} height={height} />;
    default:
      return <BarChart data={data} title={title} height={height} />;
  }
}; 