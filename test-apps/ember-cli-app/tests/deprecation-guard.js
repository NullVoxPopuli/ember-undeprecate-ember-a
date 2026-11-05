import { registerDeprecationHandler } from '@ember/debug';

const GUARDED = [
  'deprecate-ember-array-a',
  'deprecate-ember-array-mixin',
  'deprecate-mutable-array-mixin',
  'deprecate-native-array-mixin',
  'deprecate-enumerable-mixin',
  'deprecate-mutable-enumerable-mixin',
  'deprecate-observable-mixin',
  'deprecate-mixins',
  'deprecate-ember-utils',
  'deprecate-evented',
];

registerDeprecationHandler((message, options, next) => {
  if (GUARDED.includes(options?.id)) {
    throw new Error(`[${options.id}] ${message}`);
  }

  next(message, options);
});
