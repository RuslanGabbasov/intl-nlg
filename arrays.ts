// @ts-ignore
export {};

/*eslint no-extend-native: ["error", { "exceptions": ["Array"] }]*/
declare global {
  interface Array<T> {
    last(): T;
    random(): T;
    groupBy(property: string): Map<any, T[]>;
    shake(seed?: string): T[];
}
}

Array.prototype.random = function (): any {
  return this[Math.floor(Math.random()*this.length)]
};

Array.prototype.last = function (): any {
  if (!this.length) {
    return this;
  }
  return this[this.length - 1];
};

Array.prototype.groupBy = function(property: string): Map<any, any> {
  return this.reduce((total: Map<any, any>, obj: any) => {
    const propsPath = property.split('.');
    let key = obj[property];
    if (propsPath.length) {
      key = obj;
      propsPath.map(prop => key = key[prop])
    }
    if (!total.has(key)) {
      total.set(key, []);
    }
    total.get(key).push(obj);
    return total;
  }, new Map());
};

Array.prototype.shake = function (seed?: string): any {
  const random = seed ? xmur3(seed) : Math.random;
  let c = this.length - 1;
  while (c) {
    // tslint:disable-next-line:no-bitwise
    let b = random() * c-- | 0;
    if (b > this.length - 1) b = this.length - 1;

    if (b !== c)
      [this[b], this[c]] = [this[c], this[b]];
  }
  return this;
};

/* tslint:disable:no-bitwise */
export function xmur3(str: string) {
  for(var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353),
        h = h << 13 | h >>> 19;
  return function() {
    h = Math.imul(h ^ h >>> 16, 2246822507);
    h = Math.imul(h ^ h >>> 13, 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 3266489909;
  }
}
/* tslint:enable:no-bitwise */