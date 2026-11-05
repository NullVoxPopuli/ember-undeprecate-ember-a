type Callback<T, Target> = (
  this: Target,
  item: T,
  index: number,
  array: NativeArray<T>,
) => unknown;

export interface NativeArray<T> extends Array<T> {
  '[]': this;
  readonly firstObject: T | undefined;
  readonly lastObject: T | undefined;

  objectAt(idx: number): T | undefined;
  objectsAt(indexes: number[]): Array<T | undefined>;
  getEach<K extends keyof T>(key: K): Array<T[K]>;
  getEach(key: string): unknown[];
  setEach<K extends keyof T>(key: K, value: T[K]): void;
  setEach(key: string, value: unknown): void;
  mapBy<K extends keyof T>(key: K): Array<T[K]>;
  mapBy(key: string): unknown[];
  reject<Target>(callback: Callback<T, Target>, target?: Target): T[];
  filterBy(key: string, value?: unknown): T[];
  rejectBy(key: string, value?: unknown): T[];
  findBy(key: string, value?: unknown): T | undefined;
  isEvery(key: string, value?: unknown): boolean;
  any<Target>(callback: Callback<T, Target>, target?: Target): boolean;
  isAny(key: string, value?: unknown): boolean;
  invoke(methodName: string, ...args: unknown[]): NativeArray<unknown>;
  toArray(): T[];
  compact(): Array<NonNullable<T>>;
  sortBy(...keys: string[]): T[];
  uniq(): NativeArray<T>;
  uniqBy(key: string): NativeArray<T>;
  uniqBy(callback: (value: T) => unknown): NativeArray<T>;
  without(value: T): T[];

  replace(idx: number, amt: number, objects?: readonly T[]): this;
  clear(): this;
  insertAt(idx: number, object: T): this;
  removeAt(start: number, len?: number): this;
  pushObject(obj: T): T;
  pushObjects(objects: T[]): this;
  popObject(): T | null | undefined;
  shiftObject(): T | null | undefined;
  unshiftObject(object: T): T;
  unshiftObjects(objects: T[]): this;
  reverseObjects(): this;
  setObjects(objects: T[]): this;
  removeObject(object: T): this;
  removeObjects(objects: T[]): this;
  addObject(obj: T): this;
  addObjects(objects: T[]): this;

  get<K extends keyof this>(key: K): this[K];
  get(key: string): unknown;
  getProperties<L extends Array<keyof this>>(
    list: L,
  ): { [Key in L[number]]: this[Key] };
  getProperties<L extends Array<keyof this>>(
    ...list: L
  ): { [Key in L[number]]: this[Key] };
  getProperties<L extends string[]>(list: L): { [Key in L[number]]: unknown };
  getProperties<L extends string[]>(
    ...list: L
  ): { [Key in L[number]]: unknown };
  set<K extends keyof this, V extends this[K]>(key: K, value: V): V;
  set<V>(key: string, value: V): V;
  setProperties<P extends Record<string, unknown>>(hash: P): P;
  notifyPropertyChange(keyName: string): this;
  addObserver(...args: unknown[]): never;
  removeObserver(...args: unknown[]): never;
  incrementProperty(keyName: keyof this, increment?: number): number;
  decrementProperty(keyName: keyof this, decrement?: number): number;
  toggleProperty(keyName: keyof this): boolean;
  cacheFor<K extends keyof this>(key: K): unknown;
}
