type Type =
  | 'undefined'
  | 'null'
  | 'boolean'
  | 'number'
  | 'string'
  | 'array'
  | 'object'
  | 'instance'
  | 'function'
  | 'class'
  | 'date'
  | 'regexp'
  | 'filelist'
  | 'error';

const TYPE_ORDER: Record<Type, number> = {
  undefined: 0,
  null: 1,
  boolean: 2,
  number: 3,
  string: 4,
  array: 5,
  object: 6,
  instance: 7,
  function: 8,
  class: 9,
  date: 10,
  regexp: 11,
  filelist: 12,
  error: 13,
};

const TYPE_MAP: Record<string, Type> = {
  '[object Boolean]': 'boolean',
  '[object Number]': 'number',
  '[object String]': 'string',
  '[object Function]': 'function',
  '[object AsyncFunction]': 'function',
  '[object Array]': 'array',
  '[object Date]': 'date',
  '[object RegExp]': 'regexp',
  '[object Object]': 'object',
  '[object FileList]': 'filelist',
};

interface Comparable {
  compare?: (a: unknown, b: unknown) => number;
  constructor: { compare?: (a: unknown, b: unknown) => number };
}

function typeOf(item: unknown): Type {
  if (item === null) return 'null';
  if (item === undefined) return 'undefined';

  const type = TYPE_MAP[Object.prototype.toString.call(item)] ?? 'object';

  if (type === 'object') {
    if (item instanceof Error) return 'error';
    if (item instanceof Date) return 'date';
    if (isComparable(item)) return 'instance';
  }

  return type;
}

function isComparable(value: unknown): value is Comparable {
  if (typeof value !== 'object' || value === null) return false;

  const maybe = value as Partial<Comparable>;

  return (
    typeof maybe.constructor?.compare === 'function' ||
    typeof maybe.compare === 'function'
  );
}

function spaceship(a: number, b: number): number {
  return Math.sign(a - b);
}

export function compare(v: unknown, w: unknown): number {
  if (v === w) return 0;

  const type1 = typeOf(v);
  const type2 = typeOf(w);

  if (type1 === 'instance' && isComparable(v) && v.constructor.compare) {
    return v.constructor.compare(v, w);
  }

  if (type2 === 'instance' && isComparable(w) && w.constructor.compare) {
    return w.constructor.compare(w, v) * -1;
  }

  const res = spaceship(TYPE_ORDER[type1], TYPE_ORDER[type2]);

  if (res !== 0) return res;

  switch (type1) {
    case 'boolean':
      return spaceship(Number(v), Number(w));
    case 'number':
      return spaceship(v as number, w as number);
    case 'string':
      return spaceship((v as string).localeCompare(w as string), 0);
    case 'array': {
      const a = v as unknown[];
      const b = w as unknown[];
      const len = Math.min(a.length, b.length);

      for (let i = 0; i < len; i++) {
        const r = compare(a[i], b[i]);

        if (r !== 0) return r;
      }

      return spaceship(a.length, b.length);
    }
    case 'instance':
      if (isComparable(v) && v.compare) return v.compare(v, w);

      return 0;
    case 'date':
      return spaceship((v as Date).getTime(), (w as Date).getTime());
    default:
      return 0;
  }
}
