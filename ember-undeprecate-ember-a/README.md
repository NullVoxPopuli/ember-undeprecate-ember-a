# ember-undeprecate-ember-a

Keep using `A()` from `@ember/array` after ember-source deprecates it (`deprecate-ember-array-a`, ember-source 7.5).

```js
import { A } from '@ember/array';

let list = A([1, 2]);

list.pushObject(3);
list.firstObject; // 1
```

This package has two parts: a babel plugin and a v2 addon.

- The babel plugin moves the `A` import from `@ember/array` to `ember-undeprecate-ember-a`. Other imports from `@ember/array` stay where they are.
- The v2 addon has its own copy of `A()`. It does not use the `NativeArray`, `MutableArray`, `EmberArray` or `Observable` mixins, and it does not use any other deprecated Ember API. It is built on `get`, `set` and `notifyPropertyChange` from `@ember/object`, and on `consumeTag` and `tagFor` from `@glimmer/validator`.

## Compatibility

- ember-source 5.12 or later. The test suite runs against 5.12, 6.4, 6.12, the latest release, beta and alpha.
- Embroider (Vite) or ember-auto-import v2

## Installation

```sh
pnpm add ember-undeprecate-ember-a
```

Then add the babel plugin to each package that imports `A` from `@ember/array`. Each package compiles its own code, so a plugin in the app does not change an addon's code.

### Vite app (Embroider)

`babel.config.mjs`:

```js
import { fileURLToPath } from 'node:url';

export default {
  plugins: [
    fileURLToPath(
      import.meta.resolve('ember-undeprecate-ember-a/babel-plugin'),
    ),
    // ...
  ],
};
```

### Classic ember-cli app

`ember-cli-build.js`:

```js
const app = new EmberApp(defaults, {
  babel: {
    plugins: [require.resolve('ember-undeprecate-ember-a/babel-plugin')],
  },
});
```

### v1 addon

Add `ember-undeprecate-ember-a` and `ember-auto-import` to `dependencies`. Then, in `index.js`:

```js
module.exports = {
  name: require('./package').name,

  options: {
    babel: {
      plugins: [require.resolve('ember-undeprecate-ember-a/babel-plugin')],
    },
  },
};
```

### v2 addon

Add `ember-undeprecate-ember-a` to `dependencies`. Then add the plugin to `babel.publish.config.cjs`. If your tests import `A` too, also add it to `babel.config.cjs`.

```js
module.exports = {
  plugins: [
    require.resolve('ember-undeprecate-ember-a/babel-plugin'),
    // ...
  ],
};
```

The published `dist` then imports `A` from `ember-undeprecate-ember-a`.

## What the babel plugin changes

| Before | After |
| --- | --- |
| `import { A } from '@ember/array'` | `import { A } from 'ember-undeprecate-ember-a'` |
| `import { A as emberA } from '@ember/array'` | `import { A as emberA } from 'ember-undeprecate-ember-a'` |
| `import { A, isArray } from '@ember/array'` | `import { isArray } from '@ember/array'` and `import { A } from 'ember-undeprecate-ember-a'` |
| `export { A } from '@ember/array'` | `export { A } from 'ember-undeprecate-ember-a'` |

The plugin does not change:

- type-only imports, such as `import type { NativeArray } from '@ember/array'`
- `import * as array from '@ember/array'`
- `export * from '@ember/array'`
- `import('@ember/array')`
- `Ember.A` from `import Ember from 'ember'`

The plugin makes its changes when babel enters the program, so later plugins (for example the ember-auto-import analyzer) see the new import.

## Differences from Ember's `A()`

The tests compare this `A()` with Ember's `A()` on ember-source 7.4. For each method, the results and the array contents are the same. The public properties have the same descriptors. Computed properties with `@each` keys update after changes. These are the differences:

- `addObserver` and `removeObserver` throw `Will not be implemented`. Observers have their own deprecation.
- Arrays do not send `@array:before` and `@array:change` events.
- `addObjects` and `removeObjects` do not group their change notifications. This changes only when synchronous observers run.
- `firstObject` and `lastObject` notify when an index change can affect them, even if nothing has read them yet.
- Ember's private `isEmberArray` check is false for these arrays. `Array.isArray` and `isArray` from `@ember/array` are true.
- `sortBy` uses a copy of Ember's `compare`. Objects that have a `compare` method, or whose class has one, sort as comparable instances. Other `EmberObject` instances sort as plain objects.
- The private methods `beginPropertyChanges`, `endPropertyChanges` and `hasObserverFor` are not added. Ember's `A()` also adds `_super` and `init` as enumerable properties of the array. This `A()` adds neither, so `Object.keys` and `for...in` list fewer keys than with Ember's `A()`.

## TypeScript

`A()` returns `NativeArray<T>`, which this package also exports:

```ts
import { A, type NativeArray } from 'ember-undeprecate-ember-a';
```

Code that imports `A` from `@ember/array` keeps using the types from ember-source.

## License

MIT. `A()` and `compare` are ported from [ember.js](https://github.com/emberjs/ember.js) (MIT).
