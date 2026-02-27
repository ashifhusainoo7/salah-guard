export type SupportedLanguage = 'en' | 'ur';

interface Strings {
  appName: string;
  home: string;
  schedule: string;
  history: string;
  settings: string;
  salahGuardActive: string;
  salahGuardInactive: string;
  nextPrayer: string;
  noPrayersEnabled: string;
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  jumuah: string;
  jumuahSection: string;
  duration: string;
  minutes: string;
  enabled: string;
  disabled: string;
  save: string;
  cancel: string;
  daysOfWeek: string;
  prayerSchedule: string;
  editSchedule: string;
  dndDuration: string;
  completed: string;
  interrupted: string;
  noHistory: string;
  pullToRefresh: string;
  startTime: string;
  endTime: string;
  status: string;
  silentNotification: string;
  showLiftedNotification: string;
  darkMode: string;
  apiServerUrl: string;
  requestDndPermission: string;
  excludeBatteryOptimization: string;
  appVersion: string;
  biometricAuth: string;
  dndPermissionRequired: string;
  dndPermissionDescription: string;
  offline: string;
  offlineMessage: string;
  error: string;
  retry: string;
  loading: string;
  emptyHistory: string;
  countdown: string;
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
  sun: string;
  selectTime: string;
  rootDetected: string;
  rootDetectedMessage: string;
  iosFocusSetup: string;
  iosFocusConfigured: string;
  iosFocusSetupRequired: string;
  hour: string;
}

const en: Strings = {
  appName: 'Salah Guard',
  home: 'Home',
  schedule: 'Schedule',
  history: 'History',
  settings: 'Settings',
  salahGuardActive: 'Salah Guard Active',
  salahGuardInactive: 'Salah Guard Inactive',
  nextPrayer: 'Next Prayer',
  noPrayersEnabled: 'No prayers enabled',
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
  jumuah: "Jumu'ah",
  jumuahSection: 'Friday Congregational',
  duration: 'Duration',
  minutes: 'min',
  enabled: 'Enabled',
  disabled: 'Disabled',
  save: 'Save',
  cancel: 'Cancel',
  daysOfWeek: 'Days of Week',
  prayerSchedule: 'Prayer Schedule',
  editSchedule: 'Edit Schedule',
  dndDuration: 'DND Duration',
  completed: 'Completed',
  interrupted: 'Interrupted',
  noHistory: 'No history available',
  pullToRefresh: 'Pull to refresh',
  startTime: 'Start',
  endTime: 'End',
  status: 'Status',
  silentNotification: 'Silent notification on DND start',
  showLiftedNotification: 'Show notification when DND lifted',
  darkMode: 'Dark Mode',
  apiServerUrl: 'API Server URL',
  requestDndPermission: 'Request DND Permission',
  excludeBatteryOptimization: 'Exclude from Battery Optimization',
  appVersion: 'App Version',
  biometricAuth: 'Biometric Authentication',
  dndPermissionRequired: 'DND Permission Required',
  dndPermissionDescription:
    'Salah Guard needs access to Do Not Disturb settings to automatically silence your phone during prayer times.',
  offline: 'Offline',
  offlineMessage: 'Using locally saved schedules. Changes will sync when online.',
  error: 'Error',
  retry: 'Retry',
  loading: 'Loading...',
  emptyHistory: 'No DND sessions recorded yet.',
  countdown: 'in',
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
  selectTime: 'Select Time',
  rootDetected: 'Security Warning',
  rootDetectedMessage:
    'This device appears to be rooted/jailbroken. Some features may be restricted for security.',
  iosFocusSetup: 'DND Reminders',
  iosFocusConfigured: 'Enabled',
  iosFocusSetupRequired: 'Tap to enable',
  hour: 'hr',
};

const ur: Strings = {
  appName: 'نمازِ محافظ',
  home: 'ہوم',
  schedule: 'شیڈول',
  history: 'تاریخ',
  settings: 'ترتیبات',
  salahGuardActive: 'نمازِ محافظ فعال',
  salahGuardInactive: 'نمازِ محافظ غیر فعال',
  nextPrayer: 'اگلی نماز',
  noPrayersEnabled: 'کوئی نماز فعال نہیں',
  fajr: 'فجر',
  dhuhr: 'ظہر',
  asr: 'عصر',
  maghrib: 'مغرب',
  isha: 'عشاء',
  jumuah: 'جمعہ',
  jumuahSection: 'جمعہ کی نماز',
  duration: 'مدت',
  minutes: 'منٹ',
  enabled: 'فعال',
  disabled: 'غیر فعال',
  save: 'محفوظ کریں',
  cancel: 'منسوخ',
  daysOfWeek: 'ہفتے کے دن',
  prayerSchedule: 'نماز کا شیڈول',
  editSchedule: 'شیڈول میں ترمیم',
  dndDuration: 'خاموش مدت',
  completed: 'مکمل',
  interrupted: 'رکاوٹ',
  noHistory: 'کوئی تاریخ دستیاب نہیں',
  pullToRefresh: 'ریفریش کے لیے کھینچیں',
  startTime: 'شروع',
  endTime: 'ختم',
  status: 'حالت',
  silentNotification: 'خاموش وقت شروع ہونے پر اطلاع',
  showLiftedNotification: 'خاموش وقت ختم ہونے پر اطلاع',
  darkMode: 'ڈارک موڈ',
  apiServerUrl: 'سرور کا پتا',
  requestDndPermission: 'خاموش اجازت کی درخواست',
  excludeBatteryOptimization: 'بیٹری کی اصلاح سے مستثنیٰ',
  appVersion: 'ایپ ورژن',
  biometricAuth: 'بایومیٹرک تصدیق',
  dndPermissionRequired: 'خاموش اجازت درکار',
  dndPermissionDescription:
    'نمازِ محافظ کو نماز کے اوقات میں آپ کا فون خاموش کرنے کے لیے ڈو ناٹ ڈسٹرب کی ترتیبات تک رسائی درکار ہے۔',
  offline: 'آف لائن',
  offlineMessage: 'مقامی طور پر محفوظ شیڈول استعمال ہو رہے ہیں۔',
  error: 'خرابی',
  retry: 'دوبارہ کوشش',
  loading: 'لوڈ ہو رہا ہے...',
  emptyHistory: 'ابھی تک کوئی خاموش سیشن ریکارڈ نہیں ہوا۔',
  countdown: 'میں',
  mon: 'پیر',
  tue: 'منگل',
  wed: 'بدھ',
  thu: 'جمعرات',
  fri: 'جمعہ',
  sat: 'ہفتہ',
  sun: 'اتوار',
  selectTime: 'وقت منتخب کریں',
  rootDetected: 'سیکیورٹی انتباہ',
  rootDetectedMessage:
    'یہ آلہ روٹ/جیل بروکن معلوم ہوتا ہے۔ سیکیورٹی کی وجہ سے کچھ خصوصیات محدود ہو سکتی ہیں۔',
  iosFocusSetup: 'ڈی این ڈی یاد دہانی',
  iosFocusConfigured: 'فعال',
  iosFocusSetupRequired: 'فعال کرنے کے لیے ٹیپ کریں',
  hour: 'گھنٹہ',
};

const translations: Record<SupportedLanguage, Strings> = { en, ur };

let currentLanguage: SupportedLanguage = 'en';

export function setLanguage(lang: SupportedLanguage): void {
  currentLanguage = lang;
}

export function getLanguage(): SupportedLanguage {
  return currentLanguage;
}

export function t(key: keyof Strings): string {
  return translations[currentLanguage][key];
}

export default translations;
