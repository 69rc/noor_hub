export const DEFAULT_PREFERENCES = {
  theme: 'light', language: 'en', name: '', onboarded: false,
  location: { label: 'Makkah, Saudi Arabia', country: 'SA', latitude: 21.4225, longitude: 39.8262, timezone: 'Asia/Riyadh', manual: true },
  method: 'UmmAlQura', asr: 'standard', translation: 'en.sahih', reciter: 'alafasy', tajweed: true, tajweedAnimation: true, learningLevel: 'beginner',
  notifications: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false, morning: false, evening: false, quran: false, tahajjud: false, learning: false, lead: 0 },
  widgets: ['prayer', 'quran', 'dhikr', 'learning', 'hadith', 'verse', 'tahajjud'], haptics: true, quranGoal: 5, dhikrGoal: 33
};
export const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
export const PRAYER_NAMES = { fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha’a' };
export const METHODS = [{ value: 'UmmAlQura', label: 'Umm al-Qura, Makkah' }, { value: 'MuslimWorldLeague', label: 'Muslim World League' }, { value: 'Egyptian', label: 'Egyptian General Authority' }, { value: 'Karachi', label: 'University of Islamic Sciences, Karachi' }, { value: 'NorthAmerica', label: 'ISNA, North America' }, { value: 'Dubai', label: 'Dubai' }, { value: 'Qatar', label: 'Qatar' }, { value: 'Kuwait', label: 'Kuwait' }, { value: 'Singapore', label: 'Singapore / MUIS' }, { value: 'Turkey', label: 'Diyanet, Turkey' }, { value: 'Tehran', label: 'Tehran' }];
export const RECITERS = [
  { value: 'alafasy', label: 'Mishary Rashid Alafasy', style: 'Murattal', folder: 'Alafasy_128kbps', kbps: 128, fallback: { edition: 'ar.alafasy', bitrate: 128 } },
  { value: 'abdulbasit-murattal', label: 'Abdul Basit Abdus-Samad', style: 'Murattal', folder: 'Abdul_Basit_Murattal_192kbps', kbps: 192, fallback: { edition: 'ar.abdulbasitmurattal', bitrate: 64 } },
  { value: 'abdulbasit-mujawwad', label: 'Abdul Basit Abdus-Samad', style: 'Mujawwad', folder: 'Abdul_Basit_Mujawwad_128kbps', kbps: 128 },
  { value: 'sudais', label: 'Abdur-Rahman As-Sudais', style: 'Murattal', folder: 'Abdurrahmaan_As-Sudais_192kbps', kbps: 192, fallback: { edition: 'ar.abdurrahmaansudais', bitrate: 64 } },
  { value: 'shuraym', label: 'Saood Ash-Shuraym', style: 'Murattal', folder: 'Saood_ash-Shuraym_128kbps', kbps: 128, fallback: { edition: 'ar.saoodshuraym', bitrate: 64 } },
  { value: 'maher', label: 'Maher Al-Muaiqly', style: 'Murattal', folder: 'MaherAlMuaiqly128kbps', kbps: 128, fallback: { edition: 'ar.mahermuaiqly', bitrate: 128 } },
  { value: 'minshawi-murattal', label: 'Mohamed Siddiq El-Minshawi', style: 'Murattal', folder: 'Minshawy_Murattal_128kbps', kbps: 128, fallback: { edition: 'ar.minshawi', bitrate: 128 } },
  { value: 'minshawi-mujawwad', label: 'Mohamed Siddiq El-Minshawi', style: 'Mujawwad', folder: 'Minshawy_Mujawwad_192kbps', kbps: 192, fallback: { edition: 'ar.minshawimujawwad', bitrate: 64 } },
  { value: 'husary-murattal', label: 'Mahmoud Khalil Al-Husary', style: 'Murattal', folder: 'Husary_128kbps', kbps: 128, fallback: { edition: 'ar.husary', bitrate: 128 } },
  { value: 'husary-mujawwad', label: 'Mahmoud Khalil Al-Husary', style: 'Mujawwad', folder: 'Husary_128kbps_Mujawwad', kbps: 128, fallback: { edition: 'ar.husarymujawwad', bitrate: 128 } },
  { value: 'hudhaify', label: 'Ali Al-Hudhaify', style: 'Murattal', folder: 'Hudhaify_128kbps', kbps: 128, fallback: { edition: 'ar.hudhaify', bitrate: 128 } },
  { value: 'shatri', label: 'Abu Bakr Ash-Shatri', style: 'Murattal', folder: 'Abu_Bakr_Ash-Shaatree_128kbps', kbps: 128, fallback: { edition: 'ar.shaatree', bitrate: 128 } },
  { value: 'ajamy', label: 'Ahmed ibn Ali Al-Ajamy', style: 'Murattal', folder: 'ahmed_ibn_ali_al_ajamy_128kbps', kbps: 128, fallback: { edition: 'ar.ahmedajamy', bitrate: 128 } },
  { value: 'hanirifai', label: 'Hani Ar-Rifai', style: 'Murattal', folder: 'Hani_Rifai_192kbps', kbps: 192, fallback: { edition: 'ar.hanirifai', bitrate: 64 } },
  { value: 'ayyoub', label: 'Muhammad Ayyoub', style: 'Murattal', folder: 'Muhammad_Ayyoub_128kbps', kbps: 128, fallback: { edition: 'ar.muhammadayyoub', bitrate: 128 } },
  { value: 'jibreel', label: 'Muhammad Jibreel', style: 'Murattal', folder: 'Muhammad_Jibreel_128kbps', kbps: 128, fallback: { edition: 'ar.muhammadjibreel', bitrate: 128 } },
  { value: 'basfar', label: 'Abdullah Basfar', style: 'Murattal', folder: 'Abdullah_Basfar_192kbps', kbps: 192, fallback: { edition: 'ar.abdullahbasfar', bitrate: 64 } },
  { value: 'dossari', label: 'Yasser Ad-Dossari', style: 'Murattal', folder: 'Yasser_Ad-Dussary_128kbps', kbps: 128 },
  { value: 'qatami', label: 'Nasser Al-Qatami', style: 'Murattal', folder: 'Nasser_Alqatami_128kbps', kbps: 128 },
  { value: 'budair', label: 'Salah Al-Budair', style: 'Murattal', folder: 'Salah_Al_Budair_128kbps', kbps: 128 },
  { value: 'juhani', label: 'Abdullah Awad Al-Juhani', style: 'Murattal', folder: 'Abdullaah_3awwaad_Al-Juhaynee_128kbps', kbps: 128 },
  { value: 'qahtani', label: 'Khaled Al-Qahtani', style: 'Murattal', folder: 'Khaalid_Abdullaah_al-Qahtaanee_192kbps', kbps: 192 },
  { value: 'fares', label: 'Fares Abbad', style: 'Murattal', folder: 'Fares_Abbad_64kbps', kbps: 64 },
  { value: 'tablawi', label: 'Mohamed At-Tablawi', style: 'Mujawwad', folder: 'Mohammad_al_Tablaway_128kbps', kbps: 128 },
  { value: 'albanna', label: 'Mahmoud Ali Al-Banna', style: 'Mujawwad', folder: 'mahmoud_ali_al_banna_32kbps', kbps: 32 },
  { value: 'mustafaismail', label: 'Mustafa Ismail', style: 'Mujawwad', folder: 'Mustafa_Ismail_48kbps', kbps: 48 }
];
export const LEGACY_RECITERS = { 'ar.alafasy': 'alafasy', 'ar.abdulbasitmurattal': 'abdulbasit-murattal', 'ar.abdurrahmaansudais': 'sudais', 'ar.minshawi': 'minshawi-murattal', 'ar.husary': 'husary-murattal' };
export const reciterById = id => RECITERS.find(r => r.value === id) || RECITERS.find(r => r.value === (LEGACY_RECITERS[id] || '')) || RECITERS[0];
export const TRANSLATIONS = [{ value: 'en.sahih', label: 'Sahih International' }, { value: 'en.pickthall', label: 'Marmaduke Pickthall' }, { value: 'en.yusufali', label: 'Abdullah Yusuf Ali' }];
export const COUNTRIES = [{ code: 'SA', name: 'Saudi Arabia' }, { code: 'MY', name: 'Malaysia' }, { code: 'GB', name: 'United Kingdom' }, { code: 'US', name: 'United States' }, { code: 'CA', name: 'Canada' }, { code: 'AE', name: 'United Arab Emirates' }, { code: 'EG', name: 'Egypt' }, { code: 'PK', name: 'Pakistan' }, { code: 'ID', name: 'Indonesia' }, { code: 'NG', name: 'Nigeria' }, { code: 'TR', name: 'Türkiye' }, { code: 'IN', name: 'India' }, { code: 'AU', name: 'Australia' }, { code: 'FR', name: 'France' }, { code: 'DE', name: 'Germany' }, { code: 'OTHER', name: 'Another country' }];
export const WIDGETS = [{ id: 'prayer', label: 'Today’s prayers', description: 'Your five daily prayer check-ins' }, { id: 'quran', label: 'Quran reading', description: 'Daily ayah goal and reading progress' }, { id: 'dhikr', label: 'Dhikr & tasbih', description: 'A mindful moment of remembrance' }, { id: 'learning', label: 'Continue learning', description: 'Pick up your Arabic journey' }, { id: 'hadith', label: 'Daily Hadith', description: 'A verified narration with its reference' }, { id: 'verse', label: 'Daily verse', description: 'Reflect on the words of the Quran' }, { id: 'tahajjud', label: 'Tahajjud', description: 'Your night prayer companion' }];
export function loadPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem('sakinah.preferences') || '{}');
    const merged = { ...DEFAULT_PREFERENCES, ...saved, location: { ...DEFAULT_PREFERENCES.location, ...saved.location }, notifications: { ...DEFAULT_PREFERENCES.notifications, ...saved.notifications } };
    merged.reciter = LEGACY_RECITERS[merged.reciter] || merged.reciter;
    if (!RECITERS.some(r => r.value === merged.reciter)) merged.reciter = DEFAULT_PREFERENCES.reciter;
    return merged;
  } catch { return structuredClone(DEFAULT_PREFERENCES); }
}