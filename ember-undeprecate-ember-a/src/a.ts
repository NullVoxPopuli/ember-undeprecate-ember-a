import { assert } from '@ember/debug';

import { createNativeArray } from './native-array.ts';

import type { NativeArray } from './types.ts';

const NATIVE_ARRAYS = new WeakSet<object>();
const { methods, accessors } = createNativeArray(<T>(array: T[]) => A(array));

export function A<T>(this: unknown, arr?: T[]): NativeArray<T> {
  assert(
    'You cannot create an Ember Array with `new A()`, please update to calling A as a function: `A()`',
    !(this instanceof A),
  );

  const array = (arr ?? []) as T[] & Record<string, unknown>;

  if (NATIVE_ARRAYS.has(array)) return array as unknown as NativeArray<T>;

  Object.assign(array, methods);
  Object.defineProperties(array, accessors);
  NATIVE_ARRAYS.add(array);

  return array as unknown as NativeArray<T>;
}
