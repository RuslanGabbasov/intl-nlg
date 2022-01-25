import irregularPlurals from "irregular-plurals";
const getIrregularVerb = require('irregular');

export const EnglishNouns = {
  Case: {
    Base: "BF",
    PastSimple: "PS",
    PastParticiple: "PP",
    ThirdPersonSingular: "TPS",
    PresentParticipleGerund: "PPG"
  }
}

export type EnglishNounsCases = typeof EnglishNouns.Case.Base | typeof EnglishNouns.Case.PastSimple
  | typeof EnglishNouns.Case.PastParticiple | typeof EnglishNouns.Case.ThirdPersonSingular
  | typeof EnglishNouns.Case.PresentParticipleGerund;

export function plurEn(word: string, plural?: string, count?: number) {
  if (typeof plural === 'number') {
    count = plural;
  }

  if (irregularPlurals.has(word.toLowerCase())) {
    plural = irregularPlurals.get(word.toLowerCase());

    const firstLetter = word.charAt(0);
    const isFirstLetterUpperCase = firstLetter === firstLetter.toUpperCase();
    if (isFirstLetterUpperCase) {
      plural = firstLetter + plural?.slice(1);
    }

    const isWholeWordUpperCase = word === word.toUpperCase();
    if (isWholeWordUpperCase) {
      plural = plural?.toUpperCase();
    }
  } else if (typeof plural !== 'string') {
    plural = (word.replace(/(?:s|x|z|ch|sh)$/i, '$&e').replace(/([^aeiou])y$/i, '$1ie') + 's')
      .replace(/i?e?s$/i, match => {
        const isTailLowerCase = word.slice(-1) === word.slice(-1).toLowerCase();
        return isTailLowerCase ? match.toLowerCase() : match.toUpperCase();
      });
  }

  return Math.abs(count || 0) === 1 ? word : plural;
}

export function decline(word: string, form: EnglishNounsCases) {
  let result = getIrregularVerb(word)?.[form];
  if (!result) {
    if ([EnglishNouns.Case.PastSimple, EnglishNouns.Case.PastParticiple].includes(form)) {
      if (word.endsWith("e")) {
        result = word + 'd';
      } else if (word.endsWith('ry') || word.endsWith('ty') || word.endsWith('fy')) {
        result = word.slice(0, -1) + 'ied';
      } else if (word.endsWith('am')) {
        result = word + 'med';
      } else if (word.endsWith('eg')) {
        result = word + 'ged';
      } else if (word.endsWith('an')) {
        result = word + 'ned';
      } else if (word.endsWith('ip')) {
        result = word + 'ped';
      } else if (word.endsWith('er')) {
        result = word + 'red';
      } else if (word.endsWith('et')) {
        result = word + 'ted';
      } else if (word.endsWith('ip')) {
        result = word + 'ped';
      } else if (word.endsWith('el')) {
        result = word + 'led';
      } else {
        result = word + 'ed';
      }
    } else {
      // TODO: доделать всякие случаи типа come -> coming
      result = word + 'ing';
    }
  }
  return result;
}