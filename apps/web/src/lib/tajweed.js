const FATHA = 'َ';
const DAMMA = 'ُ';
const KASRA = 'ِ';
const SUKUN = 'ْ';
const SHADDA = 'ّ';
const SMALL_MIM = 'ۢ';
const SUPERSCRIPT_ALIF = 'ٰ';
const MARK = /[ً-ٰٟۖ-ۭـ]/;
const VOWEL = new RegExp(`[${FATHA}${DAMMA}${KASRA}]`);
const TANWIN = /[ًٌٍ]/;
const HAMZA = 'ءأإؤئ';
const SUN_LAM = 'تثذرزسشصضطظلن';
const MOON_LAM = 'ءابجحفخعغفقكمهوي';
const IZHAAR = 'ءأإئؤهعحغخ';
const IDGHAM = 'يرملون';
const QALQALAH = 'قطبجد';
const MADD_ALIF = 'اآى';

export const TAJWEED_RULES = [
  { id: 'madd', name: 'Madd', arabic: 'المدّ', description: 'Elongation of a vowel: 2 counts naturally, more when a hamza or sukun follows.', sample: 'قَالَ' },
  { id: 'ghunnah', name: 'Ghunnah', arabic: 'الغنّة', description: 'Nasalisation held about 2 counts on a doubled noon or meem.', sample: 'إِنَّ' },
  { id: 'ikhfa', name: 'Ikhfa', arabic: 'الإخفاء', description: 'A sakin noon or tanween hidden before fifteen letters.', sample: 'مِن قَبْلُ' },
  { id: 'idgham', name: 'Idgham', arabic: 'الإدغام', description: 'A sakin noon or tanween merged into the following letter.', sample: 'مِن رَّبِّ' },
  { id: 'iqlab', name: 'Iqlab', arabic: 'الإقلاب', description: 'A sakin noon or tanween turned into a meem before ب.', sample: 'مِنۢ بَعْدِ' },
  { id: 'izhar', name: 'Izhar', arabic: 'الإظهار', description: 'A sakin noon or tanween pronounced clearly.', sample: 'أَنْعَمْتَ' },
  { id: 'qalqalah', name: 'Qalqalah', arabic: 'القلقلة', description: 'A light echo on a stopped ق ط ب ج د.', sample: 'قَبْلُ' },
  { id: 'lam', name: 'Lam of ال', arabic: 'لام ال', description: 'Sun letters absorb the lam; moon letters keep it sounding.', sample: 'ٱلْحَمْدُ' }
];
export const tajweedClass = rule => (rule ? `taj-${rule}` : '');

function clusterize(text) {
  const nodes = [];
  let current = null;
  let word = 0;
  let positionInWord = 0;
  for (const char of text) {
    if (char === ' ') { nodes.push({ space: true, t: ' ' }); current = null; word += 1; positionInWord = 0; continue; }
    if (MARK.test(char)) {
      if (current) current.marks += char;
      else { current = { base: char, marks: '', word, positionInWord: positionInWord++ }; nodes.push(current); current = null; }
      continue;
    }
    current = { base: char, marks: '', word, positionInWord: positionInWord++ };
    nodes.push(current);
  }
  return nodes;
}

export function tajweedTokens(text) {
  const nodes = clusterize(text || '');
  const letters = nodes.filter(node => !node.space);
  const has = (node, mark) => node.marks.includes(mark);
  const hasVowel = node => VOWEL.test(node.marks);
  for (let i = 0; i < letters.length; i++) {
    const letter = letters[i];
    const prev = letters[i - 1];
    const next = letters[i + 1];
    const sameWord = node => node && node.word === letter.word;
    const prevSame = sameWord(prev) ? prev : null;
    const nextSame = sameWord(next) ? next : null;
    const nextLetter = nextSame || next;
    const base = letter.base;

    if ((base === 'ن' || base === 'م') && has(letter, SHADDA)) { letter.rule = 'ghunnah'; continue; }

    if (has(letter, SUPERSCRIPT_ALIF)) { letter.rule = 'madd'; continue; }
    const isMaddLetter = (MADD_ALIF.includes(base) && prevSame && has(prevSame, FATHA))
      || (base === 'آ' && !prevSame)
      || (base === 'و' && prevSame && has(prevSame, DAMMA) && !hasVowel(letter))
      || (base === 'ي' && prevSame && has(prevSame, KASRA) && !hasVowel(letter));
    if (isMaddLetter) {
      letter.rule = 'madd';
      const hamzaNext = node => node && HAMZA.includes(node.base);
      if (nextSame && hamzaNext(nextSame)) nextSame.rule = 'madd';
      else if (!nextSame && hamzaNext(next) && next.word === letter.word + 1) next.rule = 'madd';
      continue;
    }
    if (base === 'ه' && hasVowel(letter) && nextSame && (nextSame.base === 'و' || nextSame.base === 'ي') && !hasVowel(nextSame)) { nextSame.rule = 'madd'; continue; }

    const noonTrigger = base === 'ن' && (has(letter, SUKUN) || has(letter, SMALL_MIM) || (!hasVowel(letter) && !has(letter, SHADDA) && nextLetter && IDGHAM.includes(nextLetter.base)));
    const tanwinTrigger = TANWIN.test(letter.marks);
    if (noonTrigger || tanwinTrigger) {
      const target = nextLetter;
      if (target) {
        if (IZHAAR.includes(target.base)) letter.rule = 'izhar';
        else if (IDGHAM.includes(target.base)) letter.rule = 'idgham';
        else if (target.base === 'ب') letter.rule = 'iqlab';
        else letter.rule = 'ikhfa';
      }
      continue;
    }

    if (base === 'م' && has(letter, SUKUN) && nextSame) {
      if (nextSame.base === 'ب') letter.rule = 'ikhfa';
      else if (nextSame.base === 'م') letter.rule = 'idgham';
      continue;
    }

    if (QALQALAH.includes(base) && (has(letter, SUKUN) || !nextSame)) { letter.rule = 'qalqalah'; continue; }

    if (base === 'ل' && prevSame && (prevSame.base === 'ٱ' || (prevSame.base === 'ا' && prevSame.positionInWord === 0)) && !hasVowel(prevSame) && nextSame) {
      letter.rule = 'lam';
      continue;
    }
  }
  return nodes.map(node => (node.space ? { t: ' ', rule: null, word: node.word } : { t: node.base + node.marks, rule: node.rule || null, word: node.word }));
}
