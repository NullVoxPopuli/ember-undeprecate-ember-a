'use strict';

const { realpathSync } = require('node:fs');
const path = require('node:path');

const TARGET = 'ember-undeprecate-ember-a';
const REPLACEMENTS = {
  '@ember/array': ['A'],
};
const PACKAGE_ROOT = realpathSync(__dirname) + path.sep;

function isOwnFile(filename) {
  if (!filename) return false;

  let resolved;

  try {
    resolved = realpathSync(filename);
  } catch {
    resolved = filename;
  }

  return resolved.startsWith(PACKAGE_ROOT);
}

function nameOf(node) {
  return node.type === 'StringLiteral' ? node.value : node.name;
}

module.exports = function undeprecateEmberA({ types: t }) {
  function replacedNames(declaration) {
    let source = declaration.source?.value;

    if (!Object.hasOwn(REPLACEMENTS, source)) return undefined;
    if (declaration.importKind === 'type') return undefined;
    if (declaration.importKind === 'typeof') return undefined;
    if (declaration.exportKind === 'type') return undefined;

    return REPLACEMENTS[source];
  }

  function split(path, shouldMove, build) {
    let { node } = path;
    let moved = node.specifiers.filter(shouldMove);

    if (moved.length === 0) return false;

    let replacement = build(moved);
    let remaining = node.specifiers.filter((s) => !moved.includes(s));

    if (remaining.length === 0) {
      path.replaceWith(replacement);
    } else {
      node.specifiers = remaining;
      path.insertAfter(replacement);
    }

    return true;
  }

  return {
    name: 'ember-undeprecate-ember-a',
    visitor: {
      Program(program, state) {
        if (isOwnFile(state.filename)) return;

        let changed = false;

        program.traverse({
          ImportDeclaration(path) {
            let names = replacedNames(path.node);

            if (!names) return;

            changed =
              split(
                path,
                (s) => {
                  if (s.type === 'ImportDefaultSpecifier') {
                    return names.includes('default');
                  }

                  return (
                    s.type === 'ImportSpecifier' &&
                    s.importKind !== 'type' &&
                    s.importKind !== 'typeof' &&
                    names.includes(nameOf(s.imported))
                  );
                },
                (moved) =>
                  t.importDeclaration(
                    moved.map((s) =>
                      s.type === 'ImportDefaultSpecifier'
                        ? t.importDefaultSpecifier(t.identifier(s.local.name))
                        : t.importSpecifier(
                            t.identifier(s.local.name),
                            t.cloneNode(s.imported),
                          ),
                    ),
                    t.stringLiteral(TARGET),
                  ),
              ) || changed;
          },
          ExportNamedDeclaration(path) {
            let names = replacedNames(path.node);

            if (!names) return;

            changed =
              split(
                path,
                (s) =>
                  s.type === 'ExportSpecifier' &&
                  s.exportKind !== 'type' &&
                  names.includes(nameOf(s.local)),
                (moved) =>
                  t.exportNamedDeclaration(
                    null,
                    moved.map((s) =>
                      t.exportSpecifier(
                        t.cloneNode(s.local),
                        t.cloneNode(s.exported),
                      ),
                    ),
                    t.stringLiteral(TARGET),
                  ),
              ) || changed;
          },
        });

        if (changed) program.scope.crawl();
      },
    },
  };
};

module.exports.TARGET = TARGET;
module.exports.REPLACEMENTS = REPLACEMENTS;
