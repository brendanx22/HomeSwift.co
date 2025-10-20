import React, { createContext, useContext, useState, useEffect } from 'react';

// Language Context
const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key
});

// Language Provider Component
export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Check localStorage first, then browser language
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && ['en', 'es', 'fr', 'de', 'pt', 'ar'].includes(savedLanguage)) {
      return savedLanguage;
    }

    // Detect browser language
    const browserLang = navigator.language.split('-')[0];
    if (['en', 'es', 'fr', 'de', 'pt', 'ar'].includes(browserLang)) {
      return browserLang;
    }

    return 'en';
  });

  // Apply language to document
  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem('language', language);
  }, [language]);

  // Translation function
  const t = (key) => {
    const translations = {
      en: {
        // Navigation
        'nav.home': 'Home',
        'nav.browse': 'Browse',
        'nav.chat': 'Chat',
        'nav.saved': 'Saved',
        'nav.profile': 'Profile',
        'nav.settings': 'Settings',
        'nav.analytics': 'Analytics',
        'nav.logout': 'Log Out',

        // Common
        'common.loading': 'Loading...',
        'common.error': 'Error',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.view': 'View',
        'common.search': 'Search',
        'common.filter': 'Filter',
        'common.sort': 'Sort',

        // Property
        'property.price': 'Price',
        'property.bedrooms': 'Bedrooms',
        'property.bathrooms': 'Bathrooms',
        'property.area': 'Area',
        'property.location': 'Location',
        'property.type': 'Type',
        'property.features': 'Features',
        'property.description': 'Description',

        // Actions
        'actions.book': 'Book',
        'actions.contact': 'Contact',
        'actions.save': 'Save',
        'actions.share': 'Share',
        'actions.compare': 'Compare',

        // Status
        'status.available': 'Available',
        'status.rented': 'Rented',
        'status.sold': 'Sold',
        'status.pending': 'Pending',
        'status.active': 'Active'
      },
      es: {
        // Navigation
        'nav.home': 'Inicio',
        'nav.browse': 'Explorar',
        'nav.chat': 'Chat',
        'nav.saved': 'Guardados',
        'nav.profile': 'Perfil',
        'nav.settings': 'Configuración',
        'nav.analytics': 'Análisis',
        'nav.logout': 'Cerrar Sesión',

        // Common
        'common.loading': 'Cargando...',
        'common.error': 'Error',
        'common.save': 'Guardar',
        'common.cancel': 'Cancelar',
        'common.delete': 'Eliminar',
        'common.edit': 'Editar',
        'common.view': 'Ver',
        'common.search': 'Buscar',
        'common.filter': 'Filtrar',
        'common.sort': 'Ordenar',

        // Property
        'property.price': 'Precio',
        'property.bedrooms': 'Dormitorios',
        'property.bathrooms': 'Baños',
        'property.area': 'Área',
        'property.location': 'Ubicación',
        'property.type': 'Tipo',
        'property.features': 'Características',
        'property.description': 'Descripción',

        // Actions
        'actions.book': 'Reservar',
        'actions.contact': 'Contactar',
        'actions.save': 'Guardar',
        'actions.share': 'Compartir',
        'actions.compare': 'Comparar',

        // Status
        'status.available': 'Disponible',
        'status.rented': 'Alquilado',
        'status.sold': 'Vendido',
        'status.pending': 'Pendiente',
        'status.active': 'Activo'
      },
      fr: {
        // Navigation
        'nav.home': 'Accueil',
        'nav.browse': 'Parcourir',
        'nav.chat': 'Chat',
        'nav.saved': 'Sauvegardés',
        'nav.profile': 'Profil',
        'nav.settings': 'Paramètres',
        'nav.analytics': 'Analytiques',
        'nav.logout': 'Déconnexion',

        // Common
        'common.loading': 'Chargement...',
        'common.error': 'Erreur',
        'common.save': 'Enregistrer',
        'common.cancel': 'Annuler',
        'common.delete': 'Supprimer',
        'common.edit': 'Modifier',
        'common.view': 'Voir',
        'common.search': 'Rechercher',
        'common.filter': 'Filtrer',
        'common.sort': 'Trier',

        // Property
        'property.price': 'Prix',
        'property.bedrooms': 'Chambres',
        'property.bathrooms': 'Salles de bain',
        'property.area': 'Surface',
        'property.location': 'Emplacement',
        'property.type': 'Type',
        'property.features': 'Caractéristiques',
        'property.description': 'Description',

        // Actions
        'actions.book': 'Réserver',
        'actions.contact': 'Contacter',
        'actions.save': 'Sauvegarder',
        'actions.share': 'Partager',
        'actions.compare': 'Comparer',

        // Status
        'status.available': 'Disponible',
        'status.rented': 'Loué',
        'status.sold': 'Vendu',
        'status.pending': 'En attente',
        'status.active': 'Actif'
      },
      de: {
        // Navigation
        'nav.home': 'Startseite',
        'nav.browse': 'Durchsuchen',
        'nav.chat': 'Chat',
        'nav.saved': 'Gespeichert',
        'nav.profile': 'Profil',
        'nav.settings': 'Einstellungen',
        'nav.analytics': 'Analytik',
        'nav.logout': 'Abmelden',

        // Common
        'common.loading': 'Laden...',
        'common.error': 'Fehler',
        'common.save': 'Speichern',
        'common.cancel': 'Abbrechen',
        'common.delete': 'Löschen',
        'common.edit': 'Bearbeiten',
        'common.view': 'Ansehen',
        'common.search': 'Suchen',
        'common.filter': 'Filtern',
        'common.sort': 'Sortieren',

        // Property
        'property.price': 'Preis',
        'property.bedrooms': 'Schlafzimmer',
        'property.bathrooms': 'Badezimmer',
        'property.area': 'Fläche',
        'property.location': 'Standort',
        'property.type': 'Typ',
        'property.features': 'Merkmale',
        'property.description': 'Beschreibung',

        // Actions
        'actions.book': 'Buchen',
        'actions.contact': 'Kontaktieren',
        'actions.save': 'Speichern',
        'actions.share': 'Teilen',
        'actions.compare': 'Vergleichen',

        // Status
        'status.available': 'Verfügbar',
        'status.rented': 'Gemietet',
        'status.sold': 'Verkauft',
        'status.pending': 'Ausstehend',
        'status.active': 'Aktiv'
      },
      pt: {
        // Navigation
        'nav.home': 'Início',
        'nav.browse': 'Navegar',
        'nav.chat': 'Chat',
        'nav.saved': 'Salvos',
        'nav.profile': 'Perfil',
        'nav.settings': 'Configurações',
        'nav.analytics': 'Análises',
        'nav.logout': 'Sair',

        // Common
        'common.loading': 'Carregando...',
        'common.error': 'Erro',
        'common.save': 'Salvar',
        'common.cancel': 'Cancelar',
        'common.delete': 'Excluir',
        'common.edit': 'Editar',
        'common.view': 'Ver',
        'common.search': 'Pesquisar',
        'common.filter': 'Filtrar',
        'common.sort': 'Ordenar',

        // Property
        'property.price': 'Preço',
        'property.bedrooms': 'Quartos',
        'property.bathrooms': 'Banheiros',
        'property.area': 'Área',
        'property.location': 'Localização',
        'property.type': 'Tipo',
        'property.features': 'Características',
        'property.description': 'Descrição',

        // Actions
        'actions.book': 'Agendar',
        'actions.contact': 'Contatar',
        'actions.save': 'Salvar',
        'actions.share': 'Compartilhar',
        'actions.compare': 'Comparar',

        // Status
        'status.available': 'Disponível',
        'status.rented': 'Alugado',
        'status.sold': 'Vendido',
        'status.pending': 'Pendente',
        'status.active': 'Ativo'
      },
      ar: {
        // Navigation
        'nav.home': 'الرئيسية',
        'nav.browse': 'تصفح',
        'nav.chat': 'الدردشة',
        'nav.saved': 'المحفوظة',
        'nav.profile': 'الملف الشخصي',
        'nav.settings': 'الإعدادات',
        'nav.analytics': 'التحليلات',
        'nav.logout': 'تسجيل الخروج',

        // Common
        'common.loading': 'جارٍ التحميل...',
        'common.error': 'خطأ',
        'common.save': 'حفظ',
        'common.cancel': 'إلغاء',
        'common.delete': 'حذف',
        'common.edit': 'تعديل',
        'common.view': 'عرض',
        'common.search': 'بحث',
        'common.filter': 'تصفية',
        'common.sort': 'ترتيب',

        // Property
        'property.price': 'السعر',
        'property.bedrooms': 'غرف النوم',
        'property.bathrooms': 'دورات المياه',
        'property.area': 'المساحة',
        'property.location': 'الموقع',
        'property.type': 'النوع',
        'property.features': 'المميزات',
        'property.description': 'الوصف',

        // Actions
        'actions.book': 'حجز',
        'actions.contact': 'اتصال',
        'actions.save': 'حفظ',
        'actions.share': 'مشاركة',
        'actions.compare': 'مقارنة',

        // Status
        'status.available': 'متاح',
        'status.rented': 'مؤجر',
        'status.sold': 'مباع',
        'status.pending': 'معلق',
        'status.active': 'نشط'
      }
    };

    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Language Selector Component
export const LanguageSelector = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' }
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => {
          // For now, just cycle through languages
          const currentIndex = languages.findIndex(lang => lang.code === language);
          const nextIndex = (currentIndex + 1) % languages.length;
          setLanguage(languages[nextIndex].code);
        }}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800"
      >
        <span className="text-lg">{currentLanguage?.flag}</span>
        <span className="text-sm hidden sm:inline">{currentLanguage?.name}</span>
      </button>
    </div>
  );
};

// Text Component with Translation Support
export const Text = ({ children, className = '' }) => {
  const { t } = useLanguage();

  // If children is a translation key, translate it
  const translatedText = typeof children === 'string' && children.startsWith('t.')
    ? t(children.substring(2))
    : children;

  return (
    <span className={className}>{translatedText}</span>
  );
};
