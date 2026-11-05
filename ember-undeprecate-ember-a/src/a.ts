import { assert } from '@ember/debug';
import { get, notifyPropertyChange, set } from '@ember/object';
import { consumeTag, tagFor } from '@glimmer/validator';

import { compare } from './compare.ts';

import type { NativeArray } from './types.ts';

type Predicate<T> = (item: T, index: number, array: T[]) => unknown;
type AnyRecord = Record<string, unknown>;

const EMPTY_ARRAY: readonly never[] = Object.freeze([]);
const CHUNK_SIZE = 60000;
const NATIVE_ARRAYS = new WeakSet<object>();
const CACHE = new WeakMap<object, Map<string, unknown>>();

function remember(array: object, key: string, value: unknown): unknown {
  let cache = CACHE.get(array);

  if (cache === undefined) {
    cache = new Map();
    CACHE.set(array, cache);
  }

  cache.set(key, value);

  return value;
}

function iter<T>(...args: [key: string] | [key: string, value: unknown]) {
  const [key, value] = args;

  return args.length === 2
    ? (item: T) => value === get(item, key)
    : (item: T) => Boolean(get(item, key));
}

function findIndex<T>(
  array: T[],
  predicate: Predicate<T>,
  startAt: number,
): number {
  const len = array.length;

  for (let index = startAt; index < len; index++) {
    if (predicate(array[index] as T, index, array)) return index;
  }

  return -1;
}

function bound<T>(callback: Predicate<T>, target: unknown): Predicate<T> {
  return callback.bind(target);
}

function arrayContentDidChange(
  array: unknown[],
  startIdx: number,
  removeAmt: number,
  addAmt: number,
): void {
  if (addAmt - removeAmt !== 0) {
    notifyPropertyChange(array, 'length');
  }

  notifyPropertyChange(array, '[]');

  const previousLength = array.length - (addAmt - removeAmt);
  const normalStartIdx = startIdx < 0 ? previousLength + startIdx : startIdx;

  if (normalStartIdx === 0) {
    notifyPropertyChange(array, 'firstObject');
  }

  if (previousLength - 1 < normalStartIdx + removeAmt) {
    notifyPropertyChange(array, 'lastObject');
  }
}

function replaceInNativeArray<T>(
  array: T[],
  start: number,
  deleteCount: number,
  items: readonly T[],
): void {
  if (items.length <= CHUNK_SIZE) {
    array.splice(start, deleteCount, ...items);
  } else {
    array.splice(start, deleteCount);

    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      array.splice(start + i, 0, ...items.slice(i, i + CHUNK_SIZE));
    }
  }

  arrayContentDidChange(array, start, deleteCount, items.length);
}

function uniqBy<T>(
  array: T[],
  keyOrFunc: string | ((item: T) => unknown) = (item: T) => item,
): NativeArray<T> {
  const ret = A<T>();
  const seen = new Set();
  const getter =
    typeof keyOrFunc === 'function'
      ? keyOrFunc
      : (item: T) => get(item, keyOrFunc);

  array.forEach((item) => {
    const value = getter(item);

    if (!seen.has(value)) {
      seen.add(value);
      ret.push(item);
    }
  });

  return ret;
}

function insertAt<T>(array: NativeArray<T>, idx: number, item: T): T {
  assert(
    '`insertAt` index provided is out of range',
    idx > -1 && idx <= array.length,
  );
  array.replace(idx, 0, [item]);

  return item;
}

function mapBy(this: unknown[], key: string) {
  return this.map((item) => get(item, key));
}

function notImplemented(name: string) {
  return function (): never {
    throw new Error(`\`${name}\` Will not be implemented`);
  };
}

function readOnly(key: string) {
  return function (this: unknown): never {
    throw new Error(
      `Cannot set read-only property "${key}" on object: ${String(this)}`,
    );
  };
}

const accessors: PropertyDescriptorMap = {
  '[]': {
    configurable: true,
    enumerable: false,
    get(this: NativeArray<unknown>) {
      consumeTag(tagFor(this, '[]'));

      return remember(this, '[]', this);
    },
    set(this: NativeArray<unknown>, value: unknown[]) {
      this.replace(0, this.length, value);
    },
  },
  firstObject: {
    configurable: true,
    enumerable: false,
    get(this: unknown[]) {
      consumeTag(tagFor(this, '[]'));

      return remember(this, 'firstObject', this[0]);
    },
    set: readOnly('firstObject'),
  },
  lastObject: {
    configurable: true,
    enumerable: false,
    get(this: unknown[]) {
      consumeTag(tagFor(this, '[]'));

      return remember(this, 'lastObject', this[this.length - 1]);
    },
    set: readOnly('lastObject'),
  },
};

const methods = {
  objectsAt(this: unknown[], indexes: number[]) {
    return indexes.map((idx) => this[idx]);
  },

  getEach: mapBy,

  setEach(this: object[], key: string, value: unknown) {
    return this.forEach((item) => set(item, key, value));
  },

  mapBy,

  reject<T>(this: T[], callback: Predicate<T>, target: unknown = null) {
    assert(
      '`reject` expects a function as first argument.',
      typeof callback === 'function',
    );

    return this.filter(function (...args) {
      return !callback.apply(target, args);
    });
  },

  filterBy<T>(this: T[], ...args: [string] | [string, unknown]) {
    return this.filter(iter<T>(...args));
  },

  rejectBy<T>(this: NativeArray<T>, ...args: [string] | [string, unknown]) {
    return this.reject(iter<T>(...args));
  },

  findBy<T>(this: T[], ...args: [string] | [string, unknown]) {
    const index = findIndex(this, iter<T>(...args), 0);

    return index === -1 ? undefined : this[index];
  },

  isEvery<T>(this: T[], ...args: [string] | [string, unknown]) {
    const predicate = iter<T>(...args);

    return findIndex(this, (item) => !predicate(item), 0) === -1;
  },

  any<T>(this: T[], callback: Predicate<T>, target: unknown = null) {
    assert(
      '`any` expects a function as first argument.',
      typeof callback === 'function',
    );

    return findIndex(this, bound(callback, target), 0) !== -1;
  },

  isAny<T>(this: T[], ...args: [string] | [string, unknown]) {
    return findIndex(this, iter<T>(...args), 0) !== -1;
  },

  invoke(this: unknown[], methodName: string, ...args: unknown[]) {
    const ret = A();

    this.forEach((item) =>
      ret.push(
        (item as Record<string, (...args: unknown[]) => unknown>)[methodName]?.(
          ...args,
        ),
      ),
    );

    return ret;
  },

  toArray<T>(this: T[]) {
    return this.map((item) => item);
  },

  compact<T>(this: T[]) {
    return this.filter((value) => value != null);
  },

  sortBy<T>(this: NativeArray<T>, ...sortKeys: string[]) {
    return this.toArray().sort((a, b) => {
      for (const key of sortKeys) {
        const result = compare(get(a, key), get(b, key));

        if (result) return result;
      }

      return 0;
    });
  },

  uniq<T>(this: T[]) {
    return uniqBy(this);
  },

  uniqBy<T>(this: T[], key: string | ((item: T) => unknown)) {
    return uniqBy(this, key);
  },

  without<T>(this: T[], value: T) {
    if (!this.includes(value)) return this;

    const predicate =
      value === value
        ? (item: T) => item !== value
        : (item: T) => item === item;

    return this.filter(predicate);
  },

  clear(this: NativeArray<unknown>) {
    const len = this.length;

    if (len === 0) return this;

    this.replace(0, len, EMPTY_ARRAY);

    return this;
  },

  insertAt<T>(this: NativeArray<T>, idx: number, object: T) {
    insertAt(this, idx, object);

    return this;
  },

  removeAt(this: NativeArray<unknown>, start: number, len?: number) {
    assert(
      '`removeAt` index provided is out of range',
      start > -1 && start < this.length,
    );
    this.replace(start, len ?? 1, EMPTY_ARRAY);

    return this;
  },

  pushObject<T>(this: NativeArray<T>, obj: T) {
    return insertAt(this, this.length, obj);
  },

  pushObjects<T>(this: NativeArray<T>, objects: T[]) {
    this.replace(this.length, 0, objects);

    return this;
  },

  popObject<T>(this: NativeArray<T>) {
    const len = this.length;

    if (len === 0) return null;

    const ret = this[len - 1];

    this.removeAt(len - 1, 1);

    return ret;
  },

  shiftObject<T>(this: NativeArray<T>) {
    if (this.length === 0) return null;

    const ret = this[0];

    this.removeAt(0);

    return ret;
  },

  unshiftObject<T>(this: NativeArray<T>, obj: T) {
    return insertAt(this, 0, obj);
  },

  unshiftObjects<T>(this: NativeArray<T>, objects: T[]) {
    this.replace(0, 0, objects);

    return this;
  },

  reverseObjects<T>(this: NativeArray<T>) {
    const len = this.length;

    if (len === 0) return this;

    this.replace(0, len, this.toArray().reverse());

    return this;
  },

  setObjects<T>(this: NativeArray<T>, objects: T[]) {
    if (objects.length === 0) return this.clear();

    this.replace(0, this.length, objects);

    return this;
  },

  removeObject<T>(this: NativeArray<T>, obj: T) {
    let loc = this.length || 0;

    while (--loc >= 0) {
      if (this[loc] === obj) this.removeAt(loc);
    }

    return this;
  },

  removeObjects<T>(this: NativeArray<T>, objects: T[]) {
    for (let i = objects.length - 1; i >= 0; i--) {
      this.removeObject(objects[i] as T);
    }

    return this;
  },

  addObject<T>(this: NativeArray<T>, obj: T) {
    if (!this.includes(obj)) this.pushObject(obj);

    return this;
  },

  addObjects<T>(this: NativeArray<T>, objects: T[]) {
    objects.forEach((obj) => this.addObject(obj));

    return this;
  },

  get(this: object, key: string) {
    return get(this, key);
  },

  getProperties(this: object, ...args: string[] | [string[]]) {
    const keys = (
      args.length === 1 && Array.isArray(args[0]) ? args[0] : args
    ) as string[];
    const ret: AnyRecord = {};

    for (const key of keys) {
      ret[key] = get(this, key);
    }

    return ret;
  },

  set(this: object, key: string, value: unknown) {
    return set(this, key, value);
  },

  setProperties<P extends AnyRecord>(this: object, hash: P) {
    if (hash === null || typeof hash !== 'object') return hash;

    for (const key of Object.keys(hash)) {
      set(this, key, hash[key]);
    }

    return hash;
  },

  notifyPropertyChange(this: object, key: string) {
    notifyPropertyChange(this, key);

    return this;
  },

  addObserver: notImplemented('addObserver'),

  removeObserver: notImplemented('removeObserver'),

  incrementProperty(this: object, key: string, increment = 1) {
    assert(
      'Must pass a numeric value to incrementProperty',
      !isNaN(parseFloat(String(increment))) && isFinite(increment),
    );

    return set(
      this,
      key,
      (parseFloat(String(get(this, key))) || 0) + increment,
    );
  },

  decrementProperty(this: object, key: string, decrement = 1) {
    assert(
      'Must pass a numeric value to decrementProperty',
      (typeof decrement === 'number' || !isNaN(parseFloat(decrement))) &&
        isFinite(decrement),
    );

    return set(this, key, ((get(this, key) as number) || 0) - decrement);
  },

  toggleProperty(this: object, key: string) {
    return set(this, key, !get(this, key));
  },

  cacheFor(this: object, key: string) {
    return CACHE.get(this)?.get(key);
  },

  objectAt<T>(this: T[], idx: number) {
    return this[idx];
  },

  replace<T>(
    this: T[],
    start: number,
    deleteCount: number,
    items: readonly T[] = EMPTY_ARRAY,
  ) {
    assert(
      'The third argument to replace needs to be an array.',
      Array.isArray(items),
    );
    replaceInNativeArray(this, start, deleteCount, items);

    return this;
  },
};

export function A<T>(this: unknown, arr?: T[]): NativeArray<T> {
  assert(
    'You cannot create an Ember Array with `new A()`, please update to calling A as a function: `A()`',
    !(this instanceof A),
  );

  const array = (arr ?? []) as T[] & AnyRecord;

  if (NATIVE_ARRAYS.has(array)) return array as unknown as NativeArray<T>;

  Object.assign(array, methods);
  Object.defineProperties(array, accessors);
  NATIVE_ARRAYS.add(array);

  return array as unknown as NativeArray<T>;
}
