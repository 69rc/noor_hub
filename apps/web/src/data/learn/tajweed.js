// Quranic examples are quoted from the Uthmani text (AlQuran Cloud); recitation demos use everyayah.com.
// Rule summaries follow standard tajweed teaching as found in classical primers (e.g. al-Jazari's Muqaddimah) and beginner courses.
export const TAJWEED_LESSONS = [
  { id: 'intro', title: 'Introduction to Tajweed', minutes: 6,
    intro: ['Tajweed means giving every letter its right: its place of articulation, its characteristics, and the rules that apply when letters meet. It is the way the Quran was revealed and recited, passed from teacher to student.', 'The Quran itself commands measured recitation: “and recite the Quran with measured recitation” (73:4). Learning begins with listening carefully and imitating a qualified teacher.'],
    points: [{ title: 'Why it matters', text: 'A changed vowel or doubled letter can change a word’s meaning. Tajweed protects the text as it was received.' }, { title: 'How to learn', text: 'Listen, repeat, and be corrected by a teacher. These lessons introduce the rules; accurate recitation is learned mouth-to-mouth.' }],
    examples: [{ ar: 'وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا', ref: 'Quran 73:4', note: 'The command to recite slowly and distinctly.' }],
    quiz: [
      { type: 'mcq', prompt: 'What does “tajweed” primarily mean?', options: ['Giving each letter its due right in recitation', 'Reading as fast as possible', 'Memorising without listening', 'Translating the Quran'], answer: 0, explain: 'Tajweed is giving every letter its right of articulation and characteristics.' },
      { type: 'tf', prompt: 'Tajweed is best learned only from books, without a teacher.', answer: false, explain: 'Recitation is received orally; a teacher corrects what books cannot.' },
      { type: 'mcq', prompt: 'Which verse commands measured recitation?', options: ['وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا (73:4)', 'قُلْ هُوَ اللَّهُ أَحَدٌ (112:1)', 'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ (108:1)'], answer: 0, explain: 'Surah al-Muzzammil 73:4 commands tartil — measured, distinct recitation.' }
    ] },
  { id: 'makharij', title: 'Makharij al-Huruf', minutes: 8,
    intro: ['Makharij are the exit points of letters: where the sound is produced. Classical teaching groups them into five areas — the empty space of the mouth and throat, the throat, the tongue, the two lips, and the nasal passage (ghunnah).', 'Letters that share an exit point sound related; confusing them changes the word. For example ح and ه both come from the throat but at different depths.'],
    points: [{ title: 'Throat letters', text: 'ء ه (deepest), ع ح (middle), غ خ (top). Practise them as three distinct depths.' }, { title: 'Tongue letters', text: 'Most letters come from the tongue: ق ك (back), ج ش ي (middle), ص س ز (tip with whistle), ط د ت (tip at upper teeth), ظ ذ ث (tip between teeth), ل ن ر (tip at the gum ridge), ض (side of tongue at molars).' }, { title: 'Lips', text: 'ف (lower lip with upper teeth), ب م و (both lips).' }],
    examples: [{ ar: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', ref: 'Quran 1:2', note: 'Contains ح (middle throat), ه (deep throat), ع (middle throat) — three different exits.' }],
    quiz: [
      { type: 'mcq', prompt: 'Which pair comes from the two lips?', options: ['ب and م', 'ح and ع', 'ق and ك', 'ص and س'], answer: 0, explain: 'ب، م، و are produced with the lips; ح/ع are throat letters.' },
      { type: 'mcq', prompt: 'The letter ض is unique because…', options: ['its side of the tongue presses the upper molars', 'it comes from the lips', 'it is a throat letter', 'it has no exit point'], answer: 0, explain: 'ض exits from the tongue’s side against the upper molars — the hardest letter for non-natives.' },
      { type: 'tf', prompt: 'خ and غ are produced at the top of the throat.', answer: true, explain: 'غ and خ share the highest throat exit point.' }
    ] },
  { id: 'sifat', title: 'Sifat al-Huruf', minutes: 8,
    intro: ['Sifat are the characteristics a letter keeps in every state: heaviness or lightness, strength or softness, the whistle of ص س ز, the spread of ش, the echo of qalqalah, and more.', 'Heavy letters (خ ص ض غ ط ق ظ) fill the mouth with a full sound; light letters stay thin. Getting this right is what makes recitation sound Arabic.'],
    points: [{ title: 'Heavy vs light', text: 'ص is heavy; س is light. ط is heavy; ت is light. Compare them slowly.' }, { title: 'Qalqalah letters', text: 'ق ط ب ج د echo slightly when saakin — covered in its own lesson.' }, { title: 'Ghunnah', text: 'ن and م carry a nasal resonance from the nose when doubled or hidden.' }],
    examples: [{ ar: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', ref: 'Quran 1:6', note: 'ص (heavy) and س (light) appear in the same verse — contrast them.' }],
    quiz: [
      { type: 'mcq', prompt: 'Which letter is heavy (mufakhkham)?', options: ['ص', 'س', 'ت', 'ي'], answer: 0, explain: 'ص is one of the seven heavy letters; س is its light counterpart.' },
      { type: 'tf', prompt: 'A letter’s characteristics change when its vowel changes.', answer: false, explain: 'Sifat are constant; vowels change the sound but not the letter’s inherent characteristics.' },
      { type: 'mcq', prompt: 'Which letters carry ghunnah (nasal sound)?', options: ['ن and م', 'ب and ت', 'ه and ح', 'ل and ر'], answer: 0, explain: 'Noon and meem carry the nasal ghunnah from the nasal passage.' }
    ] },
  { id: 'noon', title: 'Noon Sakinah & Tanween', minutes: 10,
    intro: ['When a noon carries sukoon, or a word ends in tanween, the next letter decides one of four rules: izhar (clear), idgham (merge), iqlab (convert), or ikhfa (hide).', 'Tanween behaves exactly like a noon sakinah — it is a hidden noon sound at the word’s end.'],
    points: [{ title: 'Izhar — clear', text: 'Before throat letters (ء ه ع ح غ خ) the noon is pronounced clearly: أَنْعَمْتَ (1:7).' }, { title: 'Idgham — merge', text: 'Before ي ر م ل و ن the noon merges into the next letter; with غنة (nasal hold) except for ل and ر: مَن يَقُولُ (2:8).' }, { title: 'Iqlab — convert', text: 'Before ب the noon turns into a hidden م with ghunnah: سَمِيعًا بَصِيرًا (4:58).' }, { title: 'Ikhfa — hide', text: 'Before the remaining 15 letters the noon is hidden between izhar and idgham, with ghunnah: أَنفُسَكُمْ (2:54).' }],
    examples: [{ ar: 'أَنْعَمْتَ عَلَيْهِمْ', ref: 'Quran 1:7', note: 'Izhar: noon sakinah before ع.' }, { ar: 'وَمَن يَقُولُ', ref: 'Quran 2:8', note: 'Idgham with ghunnah: noon before ي.' }, { ar: 'إِنَّ اللَّهَ كَانَ سَمِيعًا بَصِيرًا', ref: 'Quran 4:58', note: 'Iqlab: tanween before ب.' }, { ar: 'أَنفُسَكُمْ', ref: 'Quran 2:54', note: 'Ikhfa: noon before ف.' }],
    quiz: [
      { type: 'mcq', prompt: 'Noon sakinah before ع is pronounced…', options: ['clearly (izhar)', 'merged (idgham)', 'converted (iqlab)', 'hidden (ikhfa)'], answer: 0, explain: 'ع is a throat letter, so the noon is shown clearly.' },
      { type: 'mcq', prompt: 'Tanween before ب triggers which rule?', options: ['Iqlab', 'Izhar', 'Idgham', 'Qalqalah'], answer: 0, explain: 'The noon sound converts to a hidden meem with ghunnah.' },
      { type: 'tf', prompt: 'Idgham without ghunnah happens with ل and ر.', answer: true, explain: 'Merging into ل or ر is complete, without the nasal hold.' }
    ] },
  { id: 'meem', title: 'Meem Sakinah', minutes: 7,
    intro: ['A meem with sukoon has three rules: hide it before ب (ikhfa shafawi), merge it into another م (idgham shafawi), and show it clearly before every other letter (izhar shafawi).', 'The hidden meem before ب is pronounced with a light nasal hold at the lips.'],
    points: [{ title: 'Ikhfa shafawi', text: 'وَمَا هُم بِمُؤْمِنِينَ (2:8) — meem sakinah before ب.' }, { title: 'Idgham shafawi', text: 'أَطْعَمَهُم مِّن جُوعٍ (106:4) — meem merges into meem with ghunnah.' }, { title: 'Izhar shafawi', text: 'كُنتُمْ خَيْرَ أُمَّةٍ (3:110) — meem is clear before خ; be careful not to hide it.' }],
    examples: [{ ar: 'وَمَا هُم بِمُؤْمِنِينَ', ref: 'Quran 2:8', note: 'Ikhfa shafawi.' }, { ar: 'أَطْعَمَهُم مِّن جُوعٍ', ref: 'Quran 106:4', note: 'Idgham shafawi (two meems).' }, { ar: 'كُنتُمْ خَيْرَ أُمَّةٍ', ref: 'Quran 3:110', note: 'Izhar shafawi.' }],
    quiz: [
      { type: 'mcq', prompt: 'Meem sakinah followed by ب is…', options: ['hidden with ghunnah (ikhfa shafawi)', 'merged fully', 'always clear', 'dropped'], answer: 0, explain: 'The lips prepare for ب while a light nasal meem is held.' },
      { type: 'mcq', prompt: 'Meem sakinah followed by another م is…', options: ['merged with ghunnah', 'hidden', 'clear', 'converted to ن'], answer: 0, explain: 'Two identical letters merge — idgham shafawi with ghunnah.' },
      { type: 'tf', prompt: 'Before خ, the meem sakinah is pronounced clearly.', answer: true, explain: 'خ is not ب or م, so izhar shafawi applies.' }
    ] },
  { id: 'madd', title: 'Madd Rules', minutes: 9,
    intro: ['Madd is lengthening the sound of a vowel letter. The natural madd (tabi‘i) is two counts — no cause, just the letter itself: ا و ي when saakin and matched.', 'When a hamza or a sukoon follows, the length grows: connected (wajib) or separated (ja’iz) madd before a hamza, and six counts for madd lazim when a fixed sukoon follows.'],
    points: [{ title: 'Two counts', text: 'Natural madd: نُوحِيهَا (11:49) — the و is held two counts.' }, { title: 'Before hamza', text: 'In one word: وَالسَّمَاءَ (2:22) — 4–5 counts (wajib muttasil). Across words: ja’iz munfasil, commonly 4–5 or 2 per the riwayah taught.' }, { title: 'Six counts', text: 'وَلَا الضَّالِّينَ (1:7) — madd lazim, the longest regular madd.' }],
    examples: [{ ar: 'نُوحِيهَا إِلَيْكَ', ref: 'Quran 11:49', note: 'Natural madd, two counts.' }, { ar: 'وَالسَّمَاءَ بِنَاءً', ref: 'Quran 2:22', note: 'Madd before a hamza in one word.' }, { ar: 'وَلَا الضَّالِّينَ', ref: 'Quran 1:7', note: 'Madd lazim — six counts.' }],
    quiz: [
      { type: 'mcq', prompt: 'The natural madd is held for…', options: ['two counts', 'six counts', 'one count', 'as long as you like'], answer: 0, explain: 'Madd tabi‘i is two counts — the baseline length.' },
      { type: 'mcq', prompt: 'وَلَا الضَّالِّينَ contains which madd?', options: ['Madd lazim (six counts)', 'Natural madd', 'No madd', 'Madd of the lips'], answer: 0, explain: 'A fixed shaddah/sukoon after the madd letter makes it lazim — six counts.' },
      { type: 'tf', prompt: 'Madd letters are ا و ي under their conditions.', answer: true, explain: 'Alif, waw and ya are the three madd letters.' }
    ] },
  { id: 'qalqalah', title: 'Qalqalah', minutes: 6,
    intro: ['Qalqalah is the slight echo or bounce when one of ق ط ب ج د carries a sukoon. The sound is not a vowel — it is a clean release of the consonant.', 'It is stronger at a stop (kubra) and lighter in the middle of a word (sughra). Letters with shaddah stopped upon echo most strongly.'],
    points: [{ title: 'The five letters', text: 'Collect them in the phrase قُطْبُ جَدّ — qaf, ta, ba, jim, dal.' }, { title: 'In practice', text: 'قُلْ (112:1) echoes the ق mid-verse; stopping on أَحَدٌ echoes the د.' }],
    examples: [{ ar: 'قُلْ هُوَ اللَّهُ أَحَدٌ', ref: 'Quran 112:1', note: 'Qalqalah sughra on قْ; kubra when stopping on دْ.' }, { ar: 'وَتَبَّ', ref: 'Quran 111:1', note: 'Stopping on a shaddah ب — strong echo.' }],
    quiz: [
      { type: 'mcq', prompt: 'Which set are the qalqalah letters?', options: ['ق ط ب ج د', 'ص ض ط ظ', 'ن م ي و', 'ح خ ه ع'], answer: 0, explain: 'The five echo letters are qaf, ta, ba, jim, dal.' },
      { type: 'tf', prompt: 'Qalqalah is stronger when stopping on the letter.', answer: true, explain: 'The stop (kubra) gives the strongest release.' },
      { type: 'mcq', prompt: 'Qalqalah adds…', options: ['a consonant echo, not a vowel', 'a long vowel', 'a nasal sound', 'nothing audible'], answer: 0, explain: 'It is a bounce of the consonant itself — never an added “a/u/i”.' }
    ] },
  { id: 'waqf', title: 'Stopping & Starting', minutes: 7,
    intro: ['Waqf is stopping on a word; ibtida is resuming well. A good stop completes a meaning; a bad stop can distort it. When stopping, final vowels drop and ta marbuta becomes a quiet ه.', 'Start again from a word that restores the meaning — never from the middle of a connected phrase if it changes the sense.'],
    points: [{ title: 'Stop signs', text: 'The small marks in the mushaf (م، لا، ج، صلى، قلى) guide stopping: م = required-ish stop, لا = do not stop, ج = permissible.' }, { title: 'How letters change at a stop', text: 'الْقَارِعَةُ stops as الْقَارِعَهْ; final tanween drops to a pause.' }, { title: 'Breath and meaning', text: 'Plan breaths at verse ends or marked stops; if you must stop early, resume from before the break in meaning.' }],
    examples: [{ ar: 'الْقَارِعَةُ', ref: 'Quran 101:1', note: 'Ta marbuta becomes ه at the stop.' }, { ar: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', ref: 'Quran 1:2', note: 'A complete meaning — a good stopping point.' }],
    quiz: [
      { type: 'mcq', prompt: 'When stopping, ta marbuta is pronounced as…', options: ['a quiet ه', 'a strong ت', 'a long ا', 'a nasal ن'], answer: 0, explain: 'At a stop, ة becomes ه — “al-qari‘ah”.' },
      { type: 'tf', prompt: 'Any place in a verse is equally good for a stop.', answer: false, explain: 'Stopping mid-phrase can break or distort the meaning; use complete meanings and stop marks.' },
      { type: 'mcq', prompt: 'The stop mark “لا” means…', options: ['do not stop here', 'stop always', 'stop optionally', 'repeat the verse'], answer: 0, explain: 'لا warns that stopping would harm the meaning; continue if breath allows.' }
    ] }
];