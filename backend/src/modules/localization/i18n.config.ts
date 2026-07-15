export const SUPPORTED_LOCALES = ['en', 'am'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export interface TranslationDictionary {
  common: {
    bookNow: string;
    cancel: string;
    confirm: string;
    save: string;
    delete: string;
    loading: string;
    search: string;
    viewAll: string;
  };
  fleet: {
    availableNow: string;
    perDay: string;
    seats: string;
    automatic: string;
    manual: string;
  };
  booking: {
    pickupDate: string;
    returnDate: string;
    totalPrice: string;
    confirmed: string;
    pending: string;
    cancelled: string;
    completed: string;
  };
  auth: {
    login: string;
    register: string;
    logout: string;
    email: string;
    password: string;
  };
  notifications: {
    bookingConfirmed: string;
    paymentReceived: string;
    verificationApproved: string;
  };
}

export const translations: Record<Locale, TranslationDictionary> = {
  en: {
    common: {
      bookNow: 'Book Now',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      delete: 'Delete',
      loading: 'Loading...',
      search: 'Search',
      viewAll: 'View All',
    },
    fleet: {
      availableNow: 'Available Now',
      perDay: 'per day',
      seats: 'seats',
      automatic: 'Automatic',
      manual: 'Manual',
    },
    booking: {
      pickupDate: 'Pickup Date',
      returnDate: 'Return Date',
      totalPrice: 'Total Price',
      confirmed: 'Confirmed',
      pending: 'Pending',
      cancelled: 'Cancelled',
      completed: 'Completed',
    },
    auth: {
      login: 'Log In',
      register: 'Register',
      logout: 'Log Out',
      email: 'Email',
      password: 'Password',
    },
    notifications: {
      bookingConfirmed: 'Your booking has been confirmed.',
      paymentReceived: 'Your payment has been received.',
      verificationApproved: 'Your driver verification has been approved.',
    },
  },
  am: {
    common: {
      bookNow: 'አሁን ይያዙ',
      cancel: 'ሰርዝ',
      confirm: 'አረጋግጥ',
      save: 'አስቀምጥ',
      delete: 'ሰርዝ',
      loading: 'በመጫን ላይ...',
      search: 'ፈልግ',
      viewAll: 'ሁሉንም ይመልከቱ',
    },
    fleet: {
      availableNow: 'አሁን ይገኛል',
      perDay: 'በቀን',
      seats: 'መቀመጫዎች',
      automatic: 'አውቶማቲክ',
      manual: 'ማንዋል',
    },
    booking: {
      pickupDate: 'የመውሰጃ ቀን',
      returnDate: 'የመመለሻ ቀን',
      totalPrice: 'ጠቅላላ ዋጋ',
      confirmed: 'ተረጋግጧል',
      pending: 'በመጠባበቅ ላይ',
      cancelled: 'ተሰርዟል',
      completed: 'ተጠናቅቋል',
    },
    auth: {
      login: 'ግባ',
      register: 'ተመዝገብ',
      logout: 'ውጣ',
      email: 'ኢሜይል',
      password: 'የይለፍ ቃል',
    },
    notifications: {
      bookingConfirmed: 'ቦታ ማስያዝዎ ተረጋግጧል።',
      paymentReceived: 'ክፍያዎ ደርሷል።',
      verificationApproved: 'የአሽከርካሪ ማረጋገጫዎ ጸድቋል።',
    },
  },
};

export function getTranslations(locale: string): TranslationDictionary {
  const resolved = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
  return translations[resolved];
}
