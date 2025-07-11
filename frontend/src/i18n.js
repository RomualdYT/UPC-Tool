import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      title: "UPC Decisions and Orders",
      subtitle: "Instantly search and analyze Unified Patent Court decisions and orders",
      search: {
        placeholder: "Search decisions and orders...",
        button: "Search",
        howTo: "How to search?",
        instructions: [
          "Type keywords to find relevant decisions or orders containing those keywords.",
          "Use 'quotes' to search for exact phrases.",
          "Add - before a word to exclude it.",
          "Combine multiple filters for more precise results."
        ],
        examples: [
          { example: "preliminary injunction", description: "Search for exact phrases" },
          { example: "injunction -costs", description: "Exclude specific terms" }
        ]
      },
      filters: {
        dateRange: "Date Range",
        thisMonth: "This Month",
        yearToDate: "Year to Date",
        allTime: "All Time",
        custom: "Custom",
        caseType: "Case Type",
        courtDivision: "Court Division",
        language: "Language",
        clear: "Clear Filters"
      },
      table: {
        date: "Date",
        type: "Type",
        reference: "Order Reference",
        registryNumber: "Registry Number",
        caseNumber: "Case Number",
        courtDivision: "Court Division",
        typeOfAction: "Type of Action",
        languageOfProceedings: "Language of Proceedings",
        parties: "Parties",
        patent: "Patent",
        legalNorms: "Legal Norms",
        tags: "Tags",
        actions: "Actions"
      },
      actions: {
        view: "View",
        download: "Download",
        viewDetails: "View Details"
      },
      languages: {
        da: "Danish",
        de: "German",
        en: "English",
        fr: "French",
        it: "Italian",
        nl: "Dutch"
      },
      subscription: {
        required: "To use more advanced filters, you need an active subscription.",
        subscribe: "Subscribe Now"
      },
      dashboard: {
        title: "UPC Dashboard",
        subtitle: "Analyze trends and statistics of Unified Patent Court decisions in real time",
        refresh: "Refresh",
        exploreData: "Explore Data",
        upcCode: "UPC Code",
        totalCases: "Total Cases",
        decisionsAndOrders: "Decisions and Orders",
        newCases: "New Cases",
        last30Days: "Last 30 days",
        activeDivision: "Active Division",
        mostActivity: "Most Activity",
        monthlyAverage: "Monthly Average",
        casesPerMonth: "Cases per month",
        advancedStats: "Advanced Statistics",
        commentedCases: "Commented Cases",
        importantCases: "Important Cases",
        completionRate: "Completion Rate",
        languageDistribution: "Language Distribution",
        quickActions: "Quick Actions",
        searchCases: "Search Cases",
        exportStats: "Export Statistics",
        systemOperational: "System Operational",
        syncingInProgress: "Sync in progress...",
        lastUpdate: "Last update",
        decisionsLoaded: "decisions loaded",
        caseTypeDistribution: "Case Type Distribution",
        topDivisions: "Top 5 Divisions",
        viewDetails: "View Details",
        viewAll: "View All",
        evolution6Months: "Evolution of the last 6 months",
        recentCases: "Recent Cases",
        viewAllCases: "View All Cases"
      },
      navigation: {
        dashboard: "Dashboard",
        data: "Data",
        upcCode: "UPC Code",
        backToDashboard: "Back to Dashboard"
      },
      auth: {
        login: "Login",
        register: "Register",
        connection: "Connection",
        signUp: "Sign Up"
      },
      admin: {
        dashboard: "Admin Dashboard",
        overview: "System management overview",
        totalCases: "Total Cases",
        activeSystem: "Active System",
        commentedCases: "Commented Cases",
        summariesAdded: "Summaries Added",
        importantCases: "Important Cases",
        legalContributions: "Legal Contributions",
        completionRate: "Completion Rate",
        caseDistribution: "Case Distribution",
        commented: "Commented",
        important: "Important",
        toProcess: "To Process",
        excluded: "Excluded",
        quickActions: "Quick Actions",
        manageComments: "Manage Comments",
        addSummaries: "Add summaries and contributions",
        manageUsers: "Manage Users",
        addModifyDelete: "Add, modify or delete",
        syncData: "Sync Data",
        updateFromUPC: "Update from UPC",
        systemStatus: "System Status",
        apiBackend: "API Backend",
        operational: "Operational",
        database: "Database",
        connected: "Connected",
        lastSync: "Last Sync",
        hoursAgo: "hours ago",
        administrator: "Administrator",
        fullAccess: "Full Access",
        return: "Return",
        upcAdministration: "UPC Administration",
        completeSystemManagement: "Complete system management",
        users: "Users",
        cases: "Comments and Legal Contributions Management",
        exclusions: "Exclusions",
        sync: "Synchronization",
        footer: "Footer"
      },
      notifications: {
        dataUpdated: "Data updated",
        updateError: "Error during update",
        exportSuccess: "Export successful",
        exportError: "Export error",
        viewTable: "table view",
        viewCards: "cards view",
        decisions: "decisions"
      },
      upcCode: {
        title: "Interactive UPC Code",
        subtitle: "Select an article or rule in the left navigation to view its content and associated case law",
        back: "Back",
        searchPlaceholder: "Search in texts...",
        documentType: "Document Type",
        allDocuments: "All Documents",
        navigation: "Navigation",
        loadOfficialTexts: "Load Official Texts",
        documents: "documents",
        articles: "articles",
        crossReferences: "Cross-references",
        linkedCases: "Linked Cases",
        noLinkedCases: "No linked cases found",
        viewCase: "View Case",
        documentTypes: {
          rules_of_procedure: "Rules of Procedure",
          upc_agreement: "UPC Agreement",
          statute: "Statute",
          fees: "Table of Fees"
        }
      },
      upcTextManager: {
        title: "UPC Code/JUB",
        subtitle: "Management of legal texts and regulations",
        newText: "New Text",
        editText: "Edit Text",
        documentType: "Document Type",
        section: "Section",
        articleNumber: "Article Number",
        language: "Language",
        title: "Title",
        content: "Content",
        crossReferences: "Cross-references (comma separated)",
        keywords: "Keywords (comma separated)",
        cancel: "Cancel",
        save: "Save",
        documentTypes: {
          rules_of_procedure: "Rules of Procedure",
          upc_agreement: "UPC Agreement",
          statute: "Statute",
          fees: "Fees Regulation"
        }
      }
    }
  },
  fr: {
    translation: {
      title: "Décisions et Ordonnances UPC",
      subtitle: "Recherchez et analysez instantanément les décisions et ordonnances de la Cour unifiée des brevets",
      search: {
        placeholder: "Rechercher des décisions et ordonnances...",
        button: "Rechercher",
        howTo: "Comment rechercher?",
        instructions: [
          "Tapez des mots-clés pour trouver les décisions ou ordonnances pertinentes contenant ces mots-clés.",
          "Utilisez des 'guillemets' pour rechercher des phrases exactes.",
          "Ajoutez - avant un mot pour l'exclure.",
          "Combinez plusieurs filtres pour des résultats plus précis."
        ],
        examples: [
          { example: "injonction préliminaire", description: "Rechercher des phrases exactes" },
          { example: "injonction -coûts", description: "Exclure des termes spécifiques" }
        ]
      },
      filters: {
        dateRange: "Plage de dates",
        thisMonth: "Ce mois",
        yearToDate: "Depuis le début de l'année",
        allTime: "Tout le temps",
        custom: "Personnalisé",
        caseType: "Type d'affaire",
        courtDivision: "Division du tribunal",
        language: "Langue",
        clear: "Effacer les filtres"
      },
      table: {
        date: "Date",
        type: "Type",
        reference: "Référence d'ordonnance",
        registryNumber: "Numéro de registre",
        caseNumber: "Numéro d'affaire",
        courtDivision: "Division du tribunal",
        typeOfAction: "Type d'action",
        languageOfProceedings: "Langue de la procédure",
        parties: "Parties",
        patent: "Brevet",
        legalNorms: "Normes juridiques",
        tags: "Étiquettes",
        actions: "Actions"
      },
      actions: {
        view: "Voir",
        download: "Télécharger",
        viewDetails: "Voir les détails"
      },
      languages: {
        da: "Danois",
        de: "Allemand",
        en: "Anglais",
        fr: "Français",
        it: "Italien",
        nl: "Néerlandais"
      },
      subscription: {
        required: "Pour utiliser des filtres plus avancés, vous avez besoin d'un abonnement actif.",
        subscribe: "S'abonner maintenant"
      },
      dashboard: {
        title: "Tableau de bord UPC",
        subtitle: "Analysez les tendances et statistiques des décisions de la Cour unifiée des brevets en temps réel",
        refresh: "Actualiser",
        exploreData: "Explorer les données",
        upcCode: "Code UPC",
        totalCases: "Total des cas",
        decisionsAndOrders: "Décisions et ordonnances",
        newCases: "Nouveaux cas",
        last30Days: "30 derniers jours",
        activeDivision: "Division active",
        mostActivity: "Plus d'activité",
        monthlyAverage: "Moyenne mensuelle",
        casesPerMonth: "Cas par mois",
        advancedStats: "Statistiques avancées",
        commentedCases: "Cas commentés",
        importantCases: "Cas importants",
        completionRate: "Taux de complétion",
        languageDistribution: "Répartition par langue",
        quickActions: "Actions rapides",
        searchCases: "Rechercher des cas",
        exportStats: "Exporter les stats",
        systemOperational: "Système opérationnel",
        syncingInProgress: "Synchronisation en cours...",
        lastUpdate: "Dernière mise à jour",
        decisionsLoaded: "décisions chargées",
        caseTypeDistribution: "Répartition par type de cas",
        topDivisions: "Top 5 des divisions",
        viewDetails: "Voir détails",
        viewAll: "Voir toutes",
        evolution6Months: "Évolution des 6 derniers mois",
        recentCases: "Cas récents",
        viewAllCases: "Voir tous"
      },
      navigation: {
        dashboard: "Dashboard",
        data: "Données",
        upcCode: "Code UPC",
        backToDashboard: "Retour au tableau de bord"
      },
      auth: {
        login: "Connexion",
        register: "S'inscrire",
        connection: "Connexion",
        signUp: "S'inscrire"
      },
      admin: {
        dashboard: "Tableau de bord administrateur",
        overview: "Vue d'ensemble de la gestion du système UPC Legal",
        totalCases: "Total des cas",
        activeSystem: "Système actif",
        commentedCases: "Cas commentés",
        summariesAdded: "Résumés ajoutés",
        importantCases: "Cas importants",
        legalContributions: "Apports juridiques",
        completionRate: "Taux de complétion",
        caseDistribution: "Répartition des cas",
        commented: "Cas commentés",
        important: "Cas importants",
        toProcess: "À traiter",
        excluded: "Cas exclus",
        quickActions: "Actions rapides",
        manageComments: "Gérer les commentaires",
        addSummaries: "Ajouter des résumés et apports",
        manageUsers: "Gérer les utilisateurs",
        addModifyDelete: "Ajouter, modifier ou supprimer",
        syncData: "Synchroniser les données",
        updateFromUPC: "Mettre à jour depuis UPC",
        systemStatus: "Statut du système",
        apiBackend: "API Backend",
        operational: "Opérationnel",
        database: "Base de données",
        connected: "Connectée",
        lastSync: "Dernière sync",
        hoursAgo: "Il y a 2h",
        administrator: "Administrateur",
        fullAccess: "Accès complet",
        return: "Retour",
        upcAdministration: "Administration UPC",
        completeSystemManagement: "Gestion complète du système",
        users: "Utilisateurs",
        cases: "Gestion des commentaires et apports juridiques",
        exclusions: "Exclusions",
        sync: "Synchronisation",
        footer: "Footer"
      },
      notifications: {
        dataUpdated: "Données actualisées",
        updateError: "Erreur lors de l'actualisation",
        exportSuccess: "Export réussi",
        exportError: "Erreur d'export",
        viewTable: "vue tableau",
        viewCards: "vue cartes",
        decisions: "décisions"
      },
      upcCode: {
        title: "Code UPC Interactif",
        subtitle: "Sélectionnez un article ou une règle dans la navigation de gauche pour voir son contenu et la jurisprudence associée",
        back: "Retour",
        searchPlaceholder: "Rechercher dans les textes...",
        documentType: "Type de document",
        allDocuments: "Tous les documents",
        navigation: "Navigation",
        loadOfficialTexts: "Charger textes officiels",
        documents: "documents",
        articles: "articles",
        crossReferences: "Références croisées",
        linkedCases: "Cas liés",
        noLinkedCases: "Aucun cas lié trouvé",
        viewCase: "Voir le cas",
        documentTypes: {
          rules_of_procedure: "Règles de procédure",
          upc_agreement: "Accord UPC",
          statute: "Statut",
          fees: "Table des honoraires"
        }
      },
      upcTextManager: {
        title: "Code UPC/JUB",
        subtitle: "Gestion des textes juridiques et règlements",
        newText: "Nouveau texte",
        editText: "Modifier le texte",
        documentType: "Type de document",
        section: "Section",
        articleNumber: "Numéro d'article",
        language: "Langue",
        title: "Titre",
        content: "Contenu",
        crossReferences: "Références croisées (séparées par des virgules)",
        keywords: "Mots-clés (séparés par des virgules)",
        cancel: "Annuler",
        save: "Enregistrer",
        documentTypes: {
          rules_of_procedure: "Règles de procédure",
          upc_agreement: "Accord UPC",
          statute: "Statut",
          fees: "Règlement des honoraires"
        }
      }
    }
  },
  de: {
    translation: {
      title: "UPC-Entscheidungen und Anordnungen",
      subtitle: "Sofortige Suche und Analyse von Entscheidungen und Anordnungen des Einheitlichen Patentgerichts",
      search: {
        placeholder: "Entscheidungen und Anordnungen suchen...",
        button: "Suchen",
        howTo: "Wie suchen?",
        instructions: [
          "Geben Sie Schlüsselwörter ein, um relevante Entscheidungen oder Anordnungen mit diesen Schlüsselwörtern zu finden.",
          "Verwenden Sie 'Anführungszeichen' für die Suche nach exakten Phrasen.",
          "Fügen Sie - vor einem Wort hinzu, um es auszuschließen.",
          "Kombinieren Sie mehrere Filter für präzisere Ergebnisse."
        ],
        examples: [
          { example: "einstweilige Verfügung", description: "Suche nach exakten Phrasen" },
          { example: "Verfügung -Kosten", description: "Bestimmte Begriffe ausschließen" }
        ]
      },
      filters: {
        dateRange: "Datumsbereich",
        thisMonth: "Diesen Monat",
        yearToDate: "Jahr bis heute",
        allTime: "Alle Zeit",
        custom: "Benutzerdefiniert",
        caseType: "Verfahrenstyp",
        courtDivision: "Gerichtsabteilung",
        language: "Sprache",
        clear: "Filter löschen"
      },
      table: {
        date: "Datum",
        type: "Typ",
        reference: "Anordnungsreferenz",
        registryNumber: "Registriernummer",
        caseNumber: "Fallnummer",
        courtDivision: "Gerichtsabteilung",
        typeOfAction: "Art der Klage",
        languageOfProceedings: "Verfahrenssprache",
        parties: "Parteien",
        patent: "Patent",
        legalNorms: "Rechtsnormen",
        tags: "Tags",
        actions: "Aktionen"
      },
      actions: {
        view: "Ansehen",
        download: "Herunterladen",
        viewDetails: "Details anzeigen"
      },
      languages: {
        da: "Dänisch",
        de: "Deutsch",
        en: "Englisch",
        fr: "Französisch",
        it: "Italienisch",
        nl: "Niederländisch"
      },
      subscription: {
        required: "Um erweiterte Filter zu verwenden, benötigen Sie ein aktives Abonnement.",
        subscribe: "Jetzt abonnieren"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;