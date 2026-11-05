import { module, test } from 'qunit';
import { dependencySatisfies, macroCondition } from '@embroider/macros';
import { computed, get, set } from '@ember/object';
import Mixin from '@ember/object/mixin';
import * as emberArray from '@ember/array';
import { A as undeprecatedA } from 'ember-undeprecate-ember-a';
import { createNativeArray } from 'ember-undeprecate-ember-a/native-array';
import { A } from 'v2-addon';

class Person {
  constructor(name, age, done) {
    this.name = name;
    this.age = age;
    this.done = done;
  }

  greet(greeting = 'hi') {
    return `${greeting} ${this.name}`;
  }
}

function people() {
  return [
    new Person('b', 30, true),
    new Person('a', 30, false),
    new Person('c', 20, true),
  ];
}

const names = (list) => list.map((p) => p.name);
const plain = (list) => Array.from(list);

const CASES = {
  'returns the same array': (A) => {
    let arr = [1, 2];
    return [A(arr) === arr, A(A(arr)) === arr];
  },
  'creates an empty array': (A) => plain(A()),
  objectAt: (A) => [A([1, 2]).objectAt(1), A([1]).objectAt(5)],
  objectsAt: (A) => A(['a', 'b', 'c']).objectsAt([0, 2, 5]),
  '[]': (A) => {
    let arr = A([1, 2]);
    let same = arr['[]'] === arr;
    set(arr, '[]', [3, 4, 5]);
    return [same, plain(arr)];
  },
  firstObject: (A) => [A([1, 2]).firstObject, A([]).firstObject],
  lastObject: (A) => [A([1, 2]).lastObject, A([]).lastObject],
  'firstObject is read-only': (A) => {
    try {
      set(A([1]), 'firstObject', 2);
      return 'no error';
    } catch (e) {
      return e instanceof Error;
    }
  },
  getEach: (A) => A(people()).getEach('name'),
  mapBy: (A) => A(people()).mapBy('age'),
  setEach: (A) => {
    let list = A(people());
    let ret = list.setEach('age', 1);
    return [ret, list.mapBy('age')];
  },
  reject: (A) => names(A(people()).reject((p) => p.done)),
  'reject with target': (A) =>
    A([1, 2, 3]).reject(function (x) {
      return x === this.skip;
    }, { skip: 2 }),
  filterBy: (A) => [
    names(A(people()).filterBy('done')),
    names(A(people()).filterBy('age', 30)),
  ],
  rejectBy: (A) => [
    names(A(people()).rejectBy('done')),
    names(A(people()).rejectBy('age', 30)),
  ],
  findBy: (A) => [
    A(people()).findBy('age', 20)?.name,
    A(people()).findBy('done')?.name,
    A(people()).findBy('age', 99),
  ],
  isEvery: (A) => [
    A(people()).isEvery('done'),
    A(people()).isEvery('age', 30),
    A(people().slice(0, 2)).isEvery('age', 30),
  ],
  any: (A) => [
    A([1, 2]).any((x) => x > 1),
    A([1, 2]).any((x) => x > 5),
    A([1, 2]).any(function (x) {
      return x === this.n;
    }, { n: 2 }),
  ],
  isAny: (A) => [
    A(people()).isAny('done', false),
    A(people()).isAny('age', 99),
    A(people()).isAny('done'),
  ],
  invoke: (A) => {
    let ret = A(people()).invoke('greet', 'hello');
    return [plain(ret), typeof ret.pushObject];
  },
  toArray: (A) => {
    let arr = A([1, 2]);
    let ret = arr.toArray();
    return [ret, ret !== arr];
  },
  compact: (A) => A([1, null, undefined, 0, false, 2]).compact(),
  sortBy: (A) => [
    names(A(people()).sortBy('name')),
    names(A(people()).sortBy('age', 'name')),
    A([{ v: 'b' }, { v: 1 }, { v: null }, { v: undefined }, { v: true }])
      .sortBy('v')
      .map((x) => x.v),
  ],
  uniq: (A) => {
    let ret = A([1, 2, 1, NaN, NaN]).uniq();
    return [plain(ret), typeof ret.pushObject];
  },
  uniqBy: (A) => [
    names(A(people()).uniqBy('age')),
    plain(A([1, 2, 3, 4]).uniqBy((x) => x % 2)),
  ],
  without: (A) => {
    let arr = A([1, 2, 1, 3]);
    return [arr.without(1), arr.without(9) === arr, A([NaN, 1]).without(NaN)];
  },
  clear: (A) => {
    let arr = A([1, 2]);
    return [arr.clear() === arr, plain(arr)];
  },
  insertAt: (A) => {
    let arr = A([1, 3]);
    return [arr.insertAt(1, 2) === arr, plain(arr)];
  },
  removeAt: (A) => {
    let arr = A([1, 2, 3, 4]);
    arr.removeAt(1);
    arr.removeAt(0, 2);
    return plain(arr);
  },
  pushObject: (A) => {
    let arr = A([1]);
    return [arr.pushObject(2), plain(arr)];
  },
  pushObjects: (A) => {
    let arr = A([1]);
    return [arr.pushObjects([2, 3]) === arr, plain(arr)];
  },
  popObject: (A) => {
    let arr = A([1, 2]);
    return [arr.popObject(), plain(arr), A([]).popObject()];
  },
  shiftObject: (A) => {
    let arr = A([1, 2]);
    return [arr.shiftObject(), plain(arr), A([]).shiftObject()];
  },
  unshiftObject: (A) => {
    let arr = A([2]);
    return [arr.unshiftObject(1), plain(arr)];
  },
  unshiftObjects: (A) => {
    let arr = A([3]);
    return [arr.unshiftObjects([1, 2]) === arr, plain(arr)];
  },
  reverseObjects: (A) => {
    let arr = A([1, 2, 3]);
    return [arr.reverseObjects() === arr, plain(arr)];
  },
  setObjects: (A) => {
    let arr = A([1, 2, 3]);
    arr.setObjects([4]);
    let after = plain(arr);
    arr.setObjects([]);
    return [after, plain(arr)];
  },
  removeObject: (A) => {
    let arr = A([1, 2, 1, 3]);
    return [arr.removeObject(1) === arr, plain(arr)];
  },
  removeObjects: (A) => {
    let arr = A([1, 2, 3, 4]);
    return [arr.removeObjects([1, 3]) === arr, plain(arr)];
  },
  addObject: (A) => {
    let arr = A([1, 2]);
    arr.addObject(2);
    arr.addObject(3);
    return plain(arr);
  },
  addObjects: (A) => {
    let arr = A([1, 2]);
    return [arr.addObjects([2, 3, 3]) === arr, plain(arr)];
  },
  replace: (A) => {
    let arr = A([1, 2, 3]);
    let ret = arr.replace(1, 1, ['a', 'b']);
    arr.replace(0, 1);
    return [ret === arr, plain(arr)];
  },
  'native methods still work': (A) => {
    let arr = A([3, 1, 2]);
    return [
      arr.map((x) => x * 2),
      arr.filter((x) => x > 1),
      arr.find((x) => x > 1),
      arr.includes(2),
      arr.indexOf(2),
      arr.slice(1),
    ];
  },
  'get and set': (A) => {
    let arr = A([1, 2]);
    arr.set('foo', 'bar');
    return [arr.get('length'), arr.get('foo'), arr.get('firstObject')];
  },
  getProperties: (A) => {
    let arr = A([1, 2]);
    return [
      arr.getProperties('length', 'firstObject'),
      arr.getProperties(['lastObject']),
    ];
  },
  setProperties: (A) => {
    let arr = A([1]);
    let hash = { a: 1, b: 2 };
    return [arr.setProperties(hash) === hash, arr.a, arr.b];
  },
  'increment, decrement and toggle': (A) => {
    let arr = A([]);
    return [
      arr.incrementProperty('count'),
      arr.incrementProperty('count', 5),
      arr.decrementProperty('count', 2),
      arr.decrementProperty('count'),
      arr.toggleProperty('flag'),
      arr.toggleProperty('flag'),
    ];
  },
  notifyPropertyChange: (A) => {
    let arr = A([]);
    return arr.notifyPropertyChange('length') === arr;
  },
  cacheFor: (A) => {
    let arr = A([1, 2]);
    let before = arr.cacheFor('firstObject');
    get(arr, 'firstObject');
    return [before, arr.cacheFor('firstObject'), arr.cacheFor('nothing')];
  },
};

const EXPECTED = {
  'returns the same array': [true, true],
  'creates an empty array': [],
  objectAt: [2, undefined],
  objectsAt: ['a', 'c', undefined],
  '[]': [true, [3, 4, 5]],
  firstObject: [1, undefined],
  lastObject: [2, undefined],
  'firstObject is read-only': true,
  getEach: ['b', 'a', 'c'],
  mapBy: [30, 30, 20],
  setEach: [undefined, [1, 1, 1]],
  reject: ['a'],
  'reject with target': [1, 3],
  filterBy: [
    ['b', 'c'],
    ['b', 'a'],
  ],
  rejectBy: [['a'], ['c']],
  findBy: ['c', 'b', undefined],
  isEvery: [false, false, true],
  any: [true, false, true],
  isAny: [true, false, true],
  invoke: [['hello b', 'hello a', 'hello c'], 'function'],
  toArray: [[1, 2], true],
  compact: [1, 0, false, 2],
  sortBy: [
    ['a', 'b', 'c'],
    ['c', 'a', 'b'],
    [undefined, null, true, 1, 'b'],
  ],
  uniq: [[1, 2, NaN], 'function'],
  uniqBy: [
    ['b', 'c'],
    [1, 2],
  ],
  without: [[2, 3], true, [1]],
  clear: [true, []],
  insertAt: [true, [1, 2, 3]],
  removeAt: [4],
  pushObject: [2, [1, 2]],
  pushObjects: [true, [1, 2, 3]],
  popObject: [2, [1], null],
  shiftObject: [1, [2], null],
  unshiftObject: [1, [1, 2]],
  unshiftObjects: [true, [1, 2, 3]],
  reverseObjects: [true, [3, 2, 1]],
  setObjects: [[4], []],
  removeObject: [true, [2, 3]],
  removeObjects: [true, [2, 4]],
  addObject: [1, 2, 3],
  addObjects: [true, [1, 2, 3]],
  replace: [true, ['a', 'b', 3]],
  'native methods still work': [[6, 2, 4], [3, 2], 3, true, 2, [1, 2]],
  'get and set': [2, 'bar', 1],
  getProperties: [{ length: 2, firstObject: 1 }, { lastObject: 2 }],
  setProperties: [true, 1, 2],
  'increment, decrement and toggle': [1, 6, 4, 3, true, false],
  notifyPropertyChange: true,
  cacheFor: [undefined, 1, undefined],
};

const PUBLIC_KEYS = [
  'objectsAt',
  '[]',
  'firstObject',
  'lastObject',
  'getEach',
  'setEach',
  'mapBy',
  'reject',
  'filterBy',
  'rejectBy',
  'findBy',
  'isEvery',
  'any',
  'isAny',
  'invoke',
  'toArray',
  'compact',
  'sortBy',
  'uniq',
  'uniqBy',
  'without',
  'clear',
  'insertAt',
  'removeAt',
  'pushObject',
  'pushObjects',
  'popObject',
  'shiftObject',
  'unshiftObject',
  'unshiftObjects',
  'reverseObjects',
  'setObjects',
  'removeObject',
  'removeObjects',
  'addObject',
  'addObjects',
  'get',
  'getProperties',
  'set',
  'setProperties',
  'notifyPropertyChange',
  'addObserver',
  'removeObserver',
  'incrementProperty',
  'decrementProperty',
  'toggleProperty',
  'cacheFor',
  'objectAt',
  'replace',
];

function shape(arr) {
  return PUBLIC_KEYS.map((key) => {
    let desc = Object.getOwnPropertyDescriptor(arr, key);

    if (!desc) return [key, 'missing'];

    return [key, desc.enumerable, 'value' in desc ? typeof desc.value : 'accessor'];
  });
}

module('Unit | A', function () {
  test('the import resolves to ember-undeprecate-ember-a', function (assert) {
    assert.strictEqual(A, undeprecatedA);
  });

  for (let [name, run] of Object.entries(CASES)) {
    test(name, function (assert) {
      assert.deepEqual(run(A), EXPECTED[name]);
    });
  }

  test('adds the same properties as Ember', function (assert) {
    assert.deepEqual(
      shape(A([])),
      PUBLIC_KEYS.map((key) => [
        key,
        !['[]', 'firstObject', 'lastObject'].includes(key),
        ['[]', 'firstObject', 'lastObject'].includes(key) ? 'accessor' : 'function',
      ]),
    );
  });

  test('addObserver and removeObserver throw', function (assert) {
    let arr = A([]);

    assert.throws(() => arr.addObserver('length', () => {}), /Will not be implemented/);
    assert.throws(() => arr.removeObserver('length', () => {}), /Will not be implemented/);
  });

  test('computed @each keys update', function (assert) {
    class Todos {
      items = A([{ done: false }]);

      @computed('items.@each.done')
      get doneCount() {
        return this.items.filter((item) => item.done).length;
      }
    }

    let todos = new Todos();

    assert.strictEqual(todos.doneCount, 0);

    todos.items.pushObject({ done: true });
    assert.strictEqual(todos.doneCount, 1);

    set(todos.items[0], 'done', true);
    assert.strictEqual(todos.doneCount, 2);
  });

  if (macroCondition(dependencySatisfies('ember-source', '>=7.4.0'))) {
    test('all deprecations are enabled in the tests', function (assert) {
      assert.throws(() => Mixin.create({}), /deprecate-mixins/);
    });
  }

  test('createNativeArray methods work from a prototype', function (assert) {
    let { methods, accessors } = createNativeArray((array) => array);
    let proto = Object.create(Array.prototype);

    for (let [key, value] of Object.entries(methods)) {
      Object.defineProperty(proto, key, {
        configurable: true,
        enumerable: false,
        writable: true,
        value,
      });
    }

    Object.defineProperties(proto, accessors);

    let list = Object.setPrototypeOf([2, 1, 2], proto);

    list.pushObject(3);
    list.removeAt(0);

    assert.deepEqual(Array.from(list), [1, 2, 3]);
    assert.strictEqual(list.firstObject, 1);
    assert.strictEqual(list.lastObject, 3);
    assert.deepEqual(Object.keys(list), ['0', '1', '2']);

    let unique = list.uniq();

    assert.deepEqual(unique, [1, 2, 3]);
    assert.strictEqual(unique.pushObject, undefined);
  });

  test('does not touch other arrays', function (assert) {
    A([1]);

    assert.strictEqual([].pushObject, undefined);
    assert.strictEqual(Array.prototype.pushObject, undefined);
  });

  if (
    macroCondition(dependencySatisfies('ember-source', '>=5.12.0 <7.5.0-0'))
  ) {
    module('matches the A() from ember-source', function () {
      test('the namespace import is not rewritten', function (assert) {
        assert.notStrictEqual(emberArray.A, A);
      });

      test('same properties', function (assert) {
        assert.deepEqual(shape(A([])), shape(emberArray.A([])));
      });

      for (let [name, run] of Object.entries(CASES)) {
        test(name, function (assert) {
          assert.deepEqual(run(A), run(emberArray.A));
        });
      }
    });
  }

  if (macroCondition(dependencySatisfies('ember-source', '>=7.5.0-0'))) {
    test('the deprecation guard catches the A() from ember-source', function (assert) {
      assert.throws(() => emberArray.A([]), /deprecate-ember-array-a/);
    });
  }
});
