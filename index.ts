import IntlMessageFormat from "intl-messageformat";
import RussianNouns from 'russian-nouns-js';
import typo from 'ru-typo';
import './arrays';


const rne = new RussianNouns.Engine();

declare global {
    var NLG_DEBUG: boolean;
}

// Для режима отладки поставить true
global.NLG_DEBUG = false;

type Genders = typeof RussianNouns.Gender.COMMON | typeof RussianNouns.Gender.MASCULINE | typeof RussianNouns.Gender.FEMININE | typeof RussianNouns.Gender.NEUTER;

type Cases = typeof RussianNouns.Case.NOMINATIVE |
  typeof RussianNouns.Case.GENITIVE |
  typeof RussianNouns.Case.DATIVE |
  typeof RussianNouns.Case.ACCUSATIVE |
  typeof RussianNouns.Case.LOCATIVE |
  typeof RussianNouns.Case.INSTRUMENTAL |
  typeof RussianNouns.Case.PREPOSITIONAL;

interface TokenDef {
  v: Array<string> | string
  opts: Options
}

interface Options {
  sep: string
}

interface SelectOptions extends Options {
  pos: number;
}

interface RandOptions extends Options {
  seed?: string;
}

interface PluralOptions extends Options {
  gender: Genders;
}

interface DeclineOptions extends Options {
  gender: Genders;
  case: Cases;
}

interface EnumOptions extends Options {
  last: string
}

interface MixOptions extends Options {
  seed?: string;
}

const extract = <T extends Options>(content: Array<any>, defaultOpts?: T): {values: Array<string>, opts: T} => {
  NLG_DEBUG && console.log("extract", content);
  const opts: T = {sep: " ", ...content.find?.call(content, c => c.opts)?.opts || defaultOpts};
  const values: Array<string> = Array.isArray(content)
    ? content.map(c => c.v
      ? (typeof c.v === "string") ? c.v.split(opts.sep) : c.v
      : c.split(opts.sep)).flat().filter((p: string) => p)
    : Object.getOwnPropertyNames(content).includes("v")
      ? Array.isArray((content as TokenDef).v)
        ? (content as TokenDef).v as Array<string>
        : ((content as TokenDef).v + "").split(opts.sep)
      : (content as String).split(opts.sep);
  return {values, opts}
}

const nlg = {
  typo: (content: Array<any>) => {
    NLG_DEBUG && console.log("typo", content);
    const {values, opts} = extract(content);
    return typo(values.join(opts.sep), { quotes: true });
  },

  select: (content: Array<any>) => {
    NLG_DEBUG && console.log("select", content);
    const {values, opts} = extract<SelectOptions>(content);
    return values[opts.pos];
  },

  syn: (content: Array<any>) => {
    NLG_DEBUG && console.log("syn", content);
    const {values, opts} = extract<RandOptions>(content);
    return values.random(opts.seed);
  },

  enum: (content: Array<any>) => {
    NLG_DEBUG && console.log("enum", content);
    const {values, opts} = extract<EnumOptions>(content, {sep: ",", last: "и"});
    return values
      ? opts.last
        ? `${values.slice(0, values.length - 1).join(`${opts.sep} `)} ${opts.last} ${values.reverse()[0]}`
        : values.join(`${opts.sep} `)
      : content;
  },

  plural: (content: Array<any>) => {
    NLG_DEBUG && console.log("plural", content);
    const {values, opts} = extract<PluralOptions>(content, {sep: " ", gender: RussianNouns.Gender.MASCULINE});
    return values.map(token => rne.pluralize(RussianNouns.createLemma({text: token, gender: opts.gender}))).join(' ');
  },

  decline: (content: Array<any>) => {
    NLG_DEBUG && console.log("decline", content)
    const {values, opts} = extract<DeclineOptions>(content, {sep: " ", gender: RussianNouns.Gender.MASCULINE, case: RussianNouns.Case.NOMINATIVE})
    return values.map(token => rne.decline(RussianNouns.createLemma({text: token, gender: opts.gender}), opts.case)).flat().join(opts.sep)
  },

  mix: (content: Array<any>) => {
    NLG_DEBUG && console.log("mix", content)
    const {values, opts} = extract<MixOptions>(content, {sep: "."});
    return values.shake(opts.seed || "" + Math.random()).join(`${opts.sep} `) + opts.sep;
  },
}

console.log(new IntlMessageFormat(
  `<typo><mix><plural>Привет</plural> от "<decline>{f5}</decline>" <plural>нож</plural> старых - <enum><plural>{f4}</plural></enum> и штиблет <syn>разные варианты {f1}</syn>
 <enum>{f2}</enum> или <enum>{f3}</enum>. Второе предложение <select>{f6}</select>. Третье предложение.</mix></typo>`,
  "ru-RU").format(
      {
        f1: {v: ["сыр", "мясо", "колбаса"], opts: {sep: ' '}},
        f2: "Спартак ЦСКА",
        f3: {v: ["Спартак", "ЦСКА", "Барселона"], opts: {sep: ",", last: "и"}},
        f4: {v: ["лошадь", "корова", "птица"], opts: {gender: RussianNouns.Gender.FEMININE}},
        f5: {v: "Локомотив", opts: {gender: RussianNouns.Gender.MASCULINE, case: RussianNouns.Case.INSTRUMENTAL}},
        f6: {v: ["ехал", "ехала", "ехали"], opts: {pos: 2}},
        ...nlg}))