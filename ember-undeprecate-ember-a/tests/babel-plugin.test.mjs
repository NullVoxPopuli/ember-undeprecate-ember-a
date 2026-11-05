import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { transformSync } from '@babel/core';

const require = createRequire(import.meta.url);
const plugin = require('../babel-plugin.cjs');

function transform(
  code,
  { filename = '/app/component.ts', plugins = [] } = {},
) {
  return transformSync(code, {
    filename,
    configFile: false,
    babelrc: false,
    plugins: [plugin, ...plugins],
  }).code;
}

function lines(...rows) {
  return rows.join('\n');
}

test('moves the A import', () => {
  assert.equal(
    transform(`import { A } from '@ember/array';`),
    `import { A } from "ember-undeprecate-ember-a";`,
  );
});

test('keeps the local name of an aliased import', () => {
  assert.equal(
    transform(`import { A as emberA } from '@ember/array';`),
    `import { A as emberA } from "ember-undeprecate-ember-a";`,
  );
});

test('leaves the other specifiers on @ember/array', () => {
  assert.equal(
    transform(`import EmberArray, { A, isArray } from '@ember/array';`),
    lines(
      `import EmberArray, { isArray } from '@ember/array';`,
      `import { A } from "ember-undeprecate-ember-a";`,
    ),
  );
});

test('moves re-exports of A', () => {
  assert.equal(
    transform(
      lines(
        `export { A } from '@ember/array';`,
        `export { A as emberA, makeArray } from '@ember/array';`,
      ),
    ),
    lines(
      `export { A } from "ember-undeprecate-ember-a";`,
      `export { makeArray } from '@ember/array';`,
      `export { A as emberA } from "ember-undeprecate-ember-a";`,
    ),
  );
});

test('leaves type-only imports alone', () => {
  let code = lines(
    `import type { NativeArray } from '@ember/array';`,
    `import { type A as B } from '@ember/array';`,
    `export type { A } from '@ember/array';`,
  );

  assert.equal(
    transformSync(code, {
      filename: '/app/component.ts',
      configFile: false,
      babelrc: false,
      parserOpts: { plugins: ['typescript'] },
      plugins: [plugin],
    }).code,
    code,
  );
});

test('leaves namespace imports, export * and import() alone', () => {
  let code = lines(
    `import * as array from '@ember/array';`,
    `export * from '@ember/array';`,
    `import('@ember/array');`,
  );

  assert.equal(transform(code), code);
});

test('leaves other modules alone', () => {
  let code = lines(
    `import { A } from 'somewhere-else';`,
    `import { isArray } from '@ember/array';`,
  );

  assert.equal(transform(code), code);
});

test('does not rewrite files inside this package', () => {
  let own = fileURLToPath(new URL('../src/index.ts', import.meta.url));

  assert.equal(
    transform(`import { A } from '@ember/array';`, { filename: own }),
    `import { A } from '@ember/array';`,
  );
});

test('runs before plugins that read import sources', () => {
  let seen = [];
  let observer = () => ({
    visitor: {
      ImportDeclaration(path) {
        seen.push(path.node.source.value);
      },
    },
  });

  transform(`import { A } from '@ember/array';`, { plugins: [observer] });

  assert.deepEqual(seen, ['ember-undeprecate-ember-a']);
});

test('the TypeScript transform keeps the moved import', () => {
  let output = transformSync(
    lines(
      `import { A, type NativeArray } from '@ember/array';`,
      `export const list: NativeArray<number> = A([1]);`,
    ),
    {
      filename: '/app/list.ts',
      configFile: false,
      babelrc: false,
      plugins: [plugin, '@babel/plugin-transform-typescript'],
    },
  ).code;

  assert.equal(
    output,
    lines(
      `import { A } from "ember-undeprecate-ember-a";`,
      `export const list = A([1]);`,
    ),
  );
});
