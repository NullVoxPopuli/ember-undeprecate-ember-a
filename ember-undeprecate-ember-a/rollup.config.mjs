import { babel } from '@rollup/plugin-babel';
import { Addon } from '@embroider/addon-dev/rollup';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const addon = new Addon({
  srcDir: 'src',
  destDir: 'dist',
});

const rootDirectory = dirname(fileURLToPath(import.meta.url));
const babelConfig = resolve(rootDirectory, './babel.publish.config.cjs');
const tsConfig = resolve(rootDirectory, './tsconfig.publish.json');

export default {
  output: addon.output(),

  plugins: [
    addon.publicEntrypoints(['index.js']),
    addon.dependencies(),
    babel({
      extensions: ['.js', '.ts'],
      babelHelpers: 'bundled',
      configFile: babelConfig,
    }),
    addon.declarations(
      'declarations',
      `pnpm ember-tsc --declaration --project ${tsConfig}`,
    ),
    addon.clean(),
  ],
};
