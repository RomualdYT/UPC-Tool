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