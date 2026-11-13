/*
 * Persian-aware word boundaries.
 *
 * JavaScript defines `\b` over [A-Za-z0-9_] only. Persian letters are not word
 * characters, so `\b` placed next to one never matches: a rule written
 * /\bترید\b/g silently does nothing. That made the whole machine-translation
 * post-edit table dead, including the report labels.
 *
 * convertBoundary() rewrites those dead `\b` into lookarounds that treat
 * Arabic-script letters as word characters, so rules can keep being authored
 * with \b and actually fire. Boundaries stay strict — a stem does not swallow
 * a suffix glued to it — so plurals are written out in the rule itself
 * (/\bتریدر(?:های|ها)?\b/) and the tables order long forms before short ones.
 * `\s` in a Persian rule is widened to include ZWNJ, since "استاپ‌لاس" and
 * "استاپ لاس" are the same term.
 */

const FA = '\\u0600-\\u06FF\\u0750-\\u077F\\uFB50-\\uFDFF\\uFE70-\\uFEFF';
const LEFT = `(?<![${FA}A-Za-z0-9_])`;
const RIGHT = `(?![${FA}])`;
/* A Persian "space" also covers ZWNJ: استاپ‌لاس is the same word as استاپ لاس. */
const FA_SPACE = `[\\s\\u200C\\u200D]`;

const isFa = (() => {
  const re = new RegExp(`[${FA}]`);
  return (ch) => !!ch && re.test(ch);
})();
const isAsciiWord = (ch) => !!ch && /[A-Za-z0-9_]/.test(ch);

/*
 * Walk a pattern source, tracking the last "consumable" character class so a
 * `\b` can be told apart as a left boundary, a right boundary, or a genuine
 * ASCII boundary that should be left alone.
 */
function convertBoundary(pattern) {
  const persian = isFa(pattern);
  let out = '';
  let prev = null;          // 'fa' | 'ascii' | 'other' | null (pattern start)
  let inClass = false;
  let i = 0;

  while (i < pattern.length) {
    const ch = pattern[i];

    if (ch === '\\' && pattern[i + 1] === 'b' && !inClass) {
      const next = pattern[i + 2];
      if (isFa(next)) out += LEFT;
      else if (prev === 'fa') out += RIGHT;
      else out += '\\b';
      i += 2;
      continue;
    }

    if (ch === '\\' && pattern[i + 1] === 'B' && !inClass) {
      // Negated boundary: same problem, same treatment.
      const next = pattern[i + 2];
      if (isFa(next)) out += `(?=[${FA}])`;
      else if (prev === 'fa') out += `(?<=[${FA}A-Za-z0-9_])`;
      else out += '\\B';
      i += 2;
      continue;
    }

    // \s in a Persian rule means "word separator", so widen it to ZWNJ.
    if (persian && ch === '\\' && pattern[i + 1] === 's') {
      out += FA_SPACE;
      i += 2;
      prev = 'other';
      continue;
    }

    if (ch === '[') { inClass = true; out += ch; i++; continue; }
    if (inClass && ch === ']') { inClass = false; out += ch; i++; prev = 'other'; continue; }
    if (inClass) { out += ch; i++; continue; }

    if (ch === '\\') {
      const esc = pattern[i + 1];
      out += ch + (esc === undefined ? '' : esc);
      i += 2;
      prev = 'other';
      continue;
    }

    // Quantifiers modify the atom before them; they are not atoms themselves.
    if (ch === '?' || ch === '*' || ch === '+' || ch === '{') {
      let j = i + 1;
      if (ch === '{') { while (j < pattern.length && pattern[j] !== '}') j++; j++; }
      out += pattern.slice(i, j);
      i = j;
      continue;
    }

    out += ch;
    i++;
    if (isFa(ch)) prev = 'fa';
    else if (isAsciiWord(ch)) prev = 'ascii';
    else if (ch === '(') prev = null;
    else if (ch === ')') { /* keep the group's last atom */ }
    else if (ch === '|') prev = null;
    else prev = 'other';
  }

  return out;
}

function withBoundary(regex) {
  if (!(regex instanceof RegExp)) return regex;
  const converted = convertBoundary(regex.source);
  return converted === regex.source ? regex : new RegExp(converted, regex.flags);
}

/* Map a [regex, replacement] table so every rule uses real Persian boundaries. */
function compileFixes(list) {
  return list.map(([re, rep]) => [withBoundary(re), rep]);
}

module.exports = { convertBoundary, withBoundary, compileFixes, FA, LEFT, RIGHT, FA_SPACE };
