export const DHIKR_COLLECTIONS = [
  { id: 'general', title: 'Everyday remembrance', period: 'Any time', items: [
    { id: 'subhan', arabic: 'سُبْحَانَ ٱللَّهِ', transliteration: 'Subḥān Allāh', meaning: 'Glory be to Allah.', reference: 'Sahih al-Bukhari 843', count: null },
    { id: 'hamd', arabic: 'ٱلْحَمْدُ لِلَّهِ', transliteration: 'Al-ḥamdu lillāh', meaning: 'All praise is for Allah.', reference: 'Sahih al-Bukhari 843', count: null },
    { id: 'tahlil', arabic: 'لَا إِلٰهَ إِلَّا ٱللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ ٱلْمُلْكُ وَلَهُ ٱلْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ', transliteration: 'Lā ilāha illā Allāhu waḥdahu lā sharīka lah, lahu al-mulku wa lahu al-ḥamdu wa huwa ʿalā kulli shayʾin qadīr', meaning: 'There is no deity except Allah alone, without partner. To Him belongs sovereignty and praise, and He is over all things competent.', reference: 'Sahih al-Bukhari 6403', count: 100 },
    { id: 'takbir', arabic: 'ٱللَّهُ أَكْبَرُ', transliteration: 'Allāhu akbar', meaning: 'Allah is the Greatest.', reference: 'Sahih al-Bukhari 843', count: null },
    { id: 'subhan-bihamd', arabic: 'سُبْحَانَ ٱللَّهِ وَبِحَمْدِهِ', transliteration: 'Subḥān Allāhi wa biḥamdih', meaning: 'Glory be to Allah, and praise be to Him.', reference: 'Sahih al-Bukhari 6405', count: 100 }
  ] },
  { id: 'after-prayer', title: 'After prayer', period: 'After obligatory prayers', items: [
    { id: 'post-subhan', arabic: 'سُبْحَانَ ٱللَّهِ', transliteration: 'Subḥān Allāh', meaning: 'Glory be to Allah.', reference: 'Sahih al-Bukhari 843', count: 33 },
    { id: 'post-hamd', arabic: 'ٱلْحَمْدُ لِلَّهِ', transliteration: 'Al-ḥamdu lillāh', meaning: 'All praise is for Allah.', reference: 'Sahih al-Bukhari 843', count: 33 },
    { id: 'post-takbir', arabic: 'ٱللَّهُ أَكْبَرُ', transliteration: 'Allāhu akbar', meaning: 'Allah is the Greatest.', reference: 'Sahih al-Bukhari 843', count: 33 }
  ] },
  { id: 'morning', title: 'Morning adhkar', period: 'Morning', source: 'https://hisnmuslim.com/', items: [] },
  { id: 'evening', title: 'Evening adhkar', period: 'Evening', source: 'https://hisnmuslim.com/', items: [] },
  { id: 'sleep', title: 'Before sleep', period: 'Bedtime', items: [
    { id: 'sleep-name', arabic: 'بِٱسْمِكَ ٱللَّهُمَّ أَمُوتُ وَأَحْيَا', transliteration: 'Bismika Allāhumma amūtu wa aḥyā', meaning: 'In Your name, O Allah, I die and I live.', reference: 'Sahih al-Bukhari 6324', count: 1 }
  ] },
  { id: 'waking', title: 'On waking', period: 'After waking', items: [
    { id: 'wake-hamd', arabic: 'ٱلْحَمْدُ لِلَّهِ ٱلَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ ٱلنُّشُورُ', transliteration: 'Al-ḥamdu lillāhi alladhī aḥyānā baʿda mā amātanā wa ilayhi al-nushūr', meaning: 'Praise is to Allah who gave us life after having taken it from us, and unto Him is the resurrection.', reference: 'Sahih al-Bukhari 6324', count: 1 }
  ] }
];