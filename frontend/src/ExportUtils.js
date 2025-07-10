import * as XLSX from 'xlsx';

// Fonction d'export Excel
export const exportToExcel = (data, filename = 'export') => {
  try {
    // Préparer les données pour l'export
    const exportData = data.map(item => ({
      'Date': formatDate(item.date),
      'Référence': item.reference || '',
      'Type': item.type || '',
      'Division': item.court_division || '',
      'Parties': Array.isArray(item.parties) ? item.parties.join(', ') : (item.parties || ''),
      'Résumé': item.summary || '',
      'Numéro de registre': item.registry_number || '',
      'Langue': item.language_of_proceedings || '',
      'Type d\'action': item.type_of_action || '',
      'Documents': item.documents ? item.documents.length : 0
    }));

    // Créer le workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Styliser l'en-tête
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[cellAddress]) continue;
      
      ws[cellAddress].s = {
        font: { 
          bold: true, 
          color: { rgb: "FFFFFF" } 
        },
        fill: { 
          fgColor: { rgb: "F97316" } 
        },
        alignment: {
          horizontal: "center",
          vertical: "center"
        }
      };
    }

    // Ajuster la largeur des colonnes
    ws['!cols'] = [
      { wch: 12 }, // Date
      { wch: 20 }, // Référence
      { wch: 10 }, // Type
      { wch: 15 }, // Division
      { wch: 30 }, // Parties
      { wch: 40 }, // Résumé
      { wch: 15 }, // Numéro de registre
      { wch: 10 }, // Langue
      { wch: 15 }, // Type d'action
      { wch: 10 }  // Documents
    ];

    // Ajouter la feuille au workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Décisions UPC');

    // Générer le fichier
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const finalFilename = `${filename}_${timestamp}.xlsx`;
    
    XLSX.writeFile(wb, finalFilename);
    
    return { success: true, filename: finalFilename };
  } catch (error) {
    console.error('Erreur lors de l\'export Excel:', error);
    return { success: false, error: error.message };
  }
};

// Fonction d'export CSV
export const exportToCSV = (data, filename = 'export') => {
  try {
    // Préparer les données
    const exportData = data.map(item => ({
      'Date': formatDate(item.date),
      'Référence': item.reference || '',
      'Type': item.type || '',
      'Division': item.court_division || '',
      'Parties': Array.isArray(item.parties) ? item.parties.join('; ') : (item.parties || ''),
      'Résumé': item.summary || '',
      'Numéro de registre': item.registry_number || '',
      'Langue': item.language_of_proceedings || '',
      'Type d\'action': item.type_of_action || ''
    }));

    // Créer le contenu CSV
    const headers = Object.keys(exportData[0]);
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          // Échapper les virgules et guillemets
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    // Créer le blob et télécharger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const finalFilename = `${filename}_${timestamp}.csv`;
    
    link.href = URL.createObjectURL(blob);
    link.download = finalFilename;
    link.click();
    URL.revokeObjectURL(link.href);
    
    return { success: true, filename: finalFilename };
  } catch (error) {
    console.error('Erreur lors de l\'export CSV:', error);
    return { success: false, error: error.message };
  }
};

// Fonction d'export JSON
export const exportToJSON = (data, filename = 'export') => {
  try {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const finalFilename = `${filename}_${timestamp}.json`;
    
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    
    link.href = URL.createObjectURL(blob);
    link.download = finalFilename;
    link.click();
    URL.revokeObjectURL(link.href);
    
    return { success: true, filename: finalFilename };
  } catch (error) {
    console.error('Erreur lors de l\'export JSON:', error);
    return { success: false, error: error.message };
  }
};

// Fonction d'export PDF (simulation - nécessiterait une bibliothèque comme jsPDF)
export const exportToPDF = (data, filename = 'export') => {
  // Cette fonction nécessiterait l'installation de jsPDF
  // Pour l'instant, on retourne une erreur
  return { 
    success: false, 
    error: 'Export PDF non implémenté. Veuillez utiliser Excel ou CSV.' 
  };
};

// Fonction utilitaire pour formater les dates
const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  } catch {
    return dateString;
  }
};

// Fonction d'export avec sélection de format
export const exportData = (data, format = 'excel', filename = 'decisions_upc') => {
  switch (format.toLowerCase()) {
    case 'excel':
    case 'xlsx':
      return exportToExcel(data, filename);
    case 'csv':
      return exportToCSV(data, filename);
    case 'json':
      return exportToJSON(data, filename);
    case 'pdf':
      return exportToPDF(data, filename);
    default:
      return exportToExcel(data, filename);
  }
};

// Fonction pour générer un rapport de statistiques
export const generateStatsReport = (data) => {
  const stats = {
    total: data.length,
    byType: {},
    byDivision: {},
    byYear: {},
    byLanguage: {},
    dateRange: { min: null, max: null }
  };

  data.forEach(item => {
    // Par type
    stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
    
    // Par division
    stats.byDivision[item.court_division] = (stats.byDivision[item.court_division] || 0) + 1;
    
    // Par année
    if (item.date) {
      const year = new Date(item.date).getFullYear();
      stats.byYear[year] = (stats.byYear[year] || 0) + 1;
      
      // Plage de dates
      const date = new Date(item.date);
      if (!stats.dateRange.min || date < stats.dateRange.min) {
        stats.dateRange.min = date;
      }
      if (!stats.dateRange.max || date > stats.dateRange.max) {
        stats.dateRange.max = date;
      }
    }
    
    // Par langue
    if (item.language_of_proceedings) {
      stats.byLanguage[item.language_of_proceedings] = (stats.byLanguage[item.language_of_proceedings] || 0) + 1;
    }
  });

  return stats;
};

// Fonction pour exporter les statistiques
export const exportStats = (data, filename = 'statistiques_upc') => {
  const stats = generateStatsReport(data);
  
  const statsData = [
    { 'Métrique': 'Total des décisions', 'Valeur': stats.total },
    { 'Métrique': 'Période', 'Valeur': `${formatDate(stats.dateRange.min)} - ${formatDate(stats.dateRange.max)}` },
    { 'Métrique': 'Nombre de divisions', 'Valeur': Object.keys(stats.byDivision).length },
    { 'Métrique': 'Nombre de types', 'Valeur': Object.keys(stats.byType).length },
    { 'Métrique': 'Nombre d\'années', 'Valeur': Object.keys(stats.byYear).length },
    { 'Métrique': 'Nombre de langues', 'Valeur': Object.keys(stats.byLanguage).length },
    { 'Métrique': '', 'Valeur': '' },
    { 'Métrique': 'Répartition par type', 'Valeur': '' },
    ...Object.entries(stats.byType).map(([type, count]) => ({
      'Métrique': `  ${type}`,
      'Valeur': count
    })),
    { 'Métrique': '', 'Valeur': '' },
    { 'Métrique': 'Répartition par division', 'Valeur': '' },
    ...Object.entries(stats.byDivision).map(([division, count]) => ({
      'Métrique': `  ${division}`,
      'Valeur': count
    })),
    { 'Métrique': '', 'Valeur': '' },
    { 'Métrique': 'Répartition par année', 'Valeur': '' },
    ...Object.entries(stats.byYear).sort(([a], [b]) => a - b).map(([year, count]) => ({
      'Métrique': `  ${year}`,
      'Valeur': count
    }))
  ];

  return exportToExcel(statsData, filename);
}; 