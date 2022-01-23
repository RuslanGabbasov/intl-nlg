import IntlMessageFormat from "intl-messageformat";
import RussianNouns from 'russian-nouns-js';
import './arrays';

declare global {
    var NLG_DEBUG: boolean;
}

global.NLG_DEBUG = false;

interface RandOptions {
  sep: string
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
  }

}

console.log(new IntlMessageFormat(
  `Привет <rand>разные варианты {f1}</rand>
 <enum>{f2}</enum> или <enum>{f3}</enum>`,
  "ru-RU").format(
      {
        f1: {v: ["first", "second", "third"], opts: {sep: ' '}},
        f2: "Спартак ЦСКА",
        f3: {v: ["Спартак", "ЦСКА", "Барселона"], opts: {sep: ",", last: "и"}}, ...nlg}))