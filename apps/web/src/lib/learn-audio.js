const HARFI_BASE = 'https://raw.githubusercontent.com/alaneas/harfibooks/main/';
export function harfiUrl(file, voice = 'female-Asmaa') {
  if (file.startsWith('book')) return HARFI_BASE + file.replace('female-Asmaa', voice);
  return `${HARFI_BASE}audio/${voice}/${file}`;
}
let clip = null;
export function playClip(url) {
  if (!clip) clip = new Audio();
  clip.src = url;
  clip.play().catch(() => {});
}
export function stopClip() { if (clip) { clip.pause(); } }
export function speakArabic(text) {
  if (!('speechSynthesis' in window)) return false;
  const voice = speechSynthesis.getVoices().find(v => v.lang.startsWith('ar'));
  if (!voice) return false;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice; utterance.lang = voice.lang; utterance.rate = 0.8;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
  return true;
}