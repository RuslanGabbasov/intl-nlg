import IntlMessageFormat from "intl-messageformat";
import RussianNouns from 'russian-nouns-js';
import './arrays';

const rne = new RussianNouns.Engine();

declare global {
    var NLG_DEBUG: boolean;
}

global.NLG_DEBUG = false;

interface RandOptions {
  sep: string
}

interface PluralOptions {
  gender: typeof RussianNouns.Gender.COMMON | typeof RussianNouns.Gender.MASCULINE | typeof RussianNouns.Gender.FEMININE | typeof RussianNouns.Gender.NEUTER;
}

interface EnumOptions {
  sep: string,
  last: string
}

const nlg = {
  rand: (content: Array<any>) => {
    NLG_DEBUG && console.log("rand", content)
    const opts: RandOptions = content.find(c => c.opts)?.opts || {sep: " "};
    const values: Array<string> = content.map(c => c.v
        ? (typeof c.v === "string") ? c.v.split(opts.sep) : c.v
        : c.split(opts.sep)
    ).flat().filter((p: string) => p);
    return values.random();
  },
  enum: ([content]: Array<any>) => {
    NLG_DEBUG && console.log("enum", content)
    const opts: EnumOptions = content.opts || {sep: ","};
    const values: Array<string> = content.v || content.split(" ");
    return values
      ? opts.last
        ? `${values.slice(0, values.length - 1).join(`${opts.sep} `)} ${opts.last} ${values.reverse()[0]}`
        : values.join(`${opts.sep} `)
      : content;
  },
  plural: (content: Array<any>) => {
    NLG_DEBUG && console.log("enum", content)
    const opts: PluralOptions = content.find(c => c.opts)?.opts || {gender: RussianNouns.Gender.MASCULINE};
    const values: Array<string> = content.map(c =>
      rne.pluralize(RussianNouns.createLemma({text: c.v || c, gender: opts.gender}))
    ).flat();
    return values.join(' ');
  }
}

console.log(new IntlMessageFormat(
  `<plural>Привет</plural> от старых штиблет <rand>разные варианты {f1}</rand>
 <enum>{f2}</enum> или <enum>{f3}</enum>`,
  "ru-RU").format(
      {
        f1: {v: ["first", "second", "third"], opts: {sep: ' '}},
        f2: "Спартак ЦСКА",
        f3: {v: ["Спартак", "ЦСКА", "Барселона"], opts: {sep: ",", last: "и"}}, ...nlg}))