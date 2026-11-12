const MARK = /[ً-ٰٟۖ-ۭـ]/;

function clusterize(text) {
  const nodes = [];
  let current = null;
  let word = 0;
  for (const char of text) {
    if (char === ' ') { nodes.push({ t: ' ', word: -1 }); current = null; word += 1; continue; }
    if (MARK.test(char)) {
      if (current) current.t += char;
      else { nodes.push({ t: char, word }); current = null; }
      continue;
    }
    current = { t: char, word };
    nodes.push(current);
  }
  return nodes;
}

export function wordTokens(text) {
  return clusterize(text || '');
}

export function wordCount(tokens) {
  return tokens.reduce((count, token) => (token.t === ' ' ? count : Math.max(count, token.word + 1)), 0);
}
