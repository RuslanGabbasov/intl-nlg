import IntlMessageFormat from "intl-messageformat";
import RussianNouns from 'russian-nouns-js';
import { Rubles } from "@vicimpa/rubles";
import typo from 'ru-typo';
import './arrays';
import {decline, EnglishNouns, EnglishNounsCases, plurEn} from "./plurEn";
import converter from 'number-to-words';

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

interface EnDeclineOptions extends Options {
  form: EnglishNounsCases;
}

interface EnumOptions extends Options {
  last: string;
}

interface NumwordsOptions extends Options {
  format: string;
  gender: Genders;
  case: Cases;
}

interface EnNumwordsOptions extends Options {
  form: 'ordinal' | 'words' | 'words-ordinal';
}

interface MixOptions extends Options {
  seed?: string;
}

const extract = <T extends Options>(content: Array<any>, defaultOpts?: T): {values: Array<string>, opts: T} => {
  NLG_DEBUG && console.log("extract", content);
  const opts: T = {sep: " ", ...defaultOpts, ...content.find?.call(content, c => c.opts)?.opts};
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

  mix: function mix(content: Array<any>) {
    NLG_DEBUG && console.log("mix", content)
    const {values, opts} = extract<MixOptions>(content, {sep: "."});
    return values.shake(opts.seed || "" + Math.random()).join(`${opts.sep} `) + opts.sep;
  },
}

const nlgRu = {
  ...nlg,

  plural: (content: Array<any>) => {
    NLG_DEBUG && console.log("plural", content);
    const {values, opts} = extract<PluralOptions>(content, {sep: " ", gender: RussianNouns.Gender.MASCULINE});
    return values.map(token => rne.pluralize(RussianNouns.createLemma({text: token, gender: opts.gender}))).join(' ');
  },

  decline: (content: Array<any>) => {
    NLG_DEBUG && console.log("decline", content)
    const {values, opts} = extract<DeclineOptions>(content, {sep: " ", gender: RussianNouns.Gender.MASCULINE, case: RussianNouns.Case.NOMINATIVE})
    return values.map(token =>
      rne.decline(RussianNouns.createLemma({text: token, gender: opts.gender}), opts.case)).flat().join(opts.sep)
  },

  numwords: (content: Array<any>) => {
    NLG_DEBUG && console.log("numwords", content)
    const {values, opts} = extract<NumwordsOptions>(content, {format: "$string", sep: " ", gender: RussianNouns.Gender.MASCULINE, case: RussianNouns.Case.NOMINATIVE});
    return values.map(token =>
      rne.decline(RussianNouns.createLemma({text: Rubles.format(+token, opts.format), gender: opts.gender}), opts.case)).flat().join(opts.sep);
  },
}

const nlgEn = {
  ...nlg,
  typo: (content: Array<any>) => {
    NLG_DEBUG && console.log("typo", content);
    const {values, opts} = extract(content);
    return typo(values.join(opts.sep));
  },

  enum: (content: Array<any>) => {
    NLG_DEBUG && console.log("enum", content);
    const {values, opts} = extract<EnumOptions>(content, {sep: ",", last: "and"});
    return values
      ? opts.last
        ? `${values.slice(0, values.length - 1).join(`${opts.sep} `)} ${opts.last} ${values.reverse()[0]}`
        : values.join(`${opts.sep} `)
      : content;
  },

  plural: (content: Array<any>) => {
    NLG_DEBUG && console.log("plural", content);
    const {values, opts} = extract<Options>(content, {sep: " "})
    return values.map(token => plurEn(token)).join(opts.sep)
  },

  decline: (content: Array<any>) => {
    NLG_DEBUG && console.log("decline", content)
    const {values, opts} = extract<EnDeclineOptions>(content, {sep: " ", form: EnglishNouns.Case.PastSimple})
    return values.map(token => decline(token, opts.form)).join(opts.sep)
  },

  numwords: (content: Array<any>) => {
    NLG_DEBUG && console.log("numwords", content)
    const {values, opts} = extract<EnNumwordsOptions>(content, {sep: " ", form: "words"})
    return values.map(token => opts.form === "words"
      ? converter.toWords(token) : opts.form === "words-ordinal"
        ? converter.toWordsOrdinal(token) : converter.toOrdinal(token)).join(opts.sep)
  },
}

console.log(new IntlMessageFormat(
  `<typo><mix><numwords>{f7}</numwords> <plural>Привет</plural> от "<decline>{f5}</decline>" <plural>нож</plural> старых - <enum><plural>{f4}</plural></enum> и штиблет <syn>разные варианты {f1}</syn>
 <enum>{f2}</enum> или <enum>{f3}</enum>. Второе предложение <select>{f6}</select>. Третье предложение.</mix></typo>`,
  "ru-RU").format(
      {
        f1: {v: ["сыр", "мясо", "колбаса"], opts: {sep: ' '}},
        f2: "Спартак ЦСКА",
        f3: {v: ["Спартак", "ЦСКА", "Барселона"], opts: {sep: ",", last: "и"}},
        f4: {v: ["лошадь", "корова", "птица"], opts: {gender: RussianNouns.Gender.FEMININE}},
        f5: {v: "Локомотив", opts: {gender: RussianNouns.Gender.MASCULINE, case: RussianNouns.Case.INSTRUMENTAL}},
        f6: {v: ["ехал", "ехала", "ехали"], opts: {pos: 2}},
        f7: {v: 15, opts: {gender: RussianNouns.Gender.FEMININE, case: RussianNouns.Case.DATIVE }},
        ...nlgRu}))

console.log(new IntlMessageFormat(
  `<typo><mix><numwords>{f7}</numwords> <plural>Hello</plural> from "<decline>{f5}</decline>" <plural>knife</plural> old - <enum><plural>{f4}</plural></enum> and shoes <syn>different cases {f1}</syn>
 <enum>{f2}</enum> or <enum>{f3}</enum>. Second sentence <select>{f6}</select>. Third sentence.</mix></typo>`, "en-US").format(
  {
    f1: {v: ["cheese", "meat", "sausage"], opts: {sep: ' '}},
    f2: "Spartak CSKA",
    f3: {v: ["Spartak", "CSKA", "Barcelona"], opts: {sep: ",", last: "и"}},
    f4: {v: ["horse", "cow", "bird"], opts: {gender: RussianNouns.Gender.FEMININE}},
    f5: {v: "Lokomotive", opts: {gender: RussianNouns.Gender.MASCULINE, case: RussianNouns.Case.INSTRUMENTAL}},
    f6: {v: ["go", "goes", "go"], opts: {pos: 1}},
    f7: {v: 15, opts: {gender: RussianNouns.Gender.FEMININE, case: RussianNouns.Case.DATIVE }},
    ...nlgEn}))