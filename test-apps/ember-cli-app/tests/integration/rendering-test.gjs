import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-cli-app/tests/helpers';
import { render, settled } from '@ember/test-helpers';
import { A } from '@ember/array';

module('Integration | A | rendering', function (hooks) {
  setupRenderingTest(hooks);

  test('updates after each mutation method', async function (assert) {
    const list = A(['a', 'b']);

    await render(
      <template>
        {{#each list as |item|}}<span>{{item}}</span>{{/each}}
        <output id="length">{{list.length}}</output>
        <output id="first">{{list.firstObject}}</output>
        <output id="last">{{list.lastObject}}</output>
      </template>,
    );

    const check = async (expected, step) => {
      await settled();
      assert.deepEqual(
        [...this.element.querySelectorAll('span')].map((el) => el.textContent),
        expected,
        `${step}: items`,
      );
      assert.dom('#length').hasText(String(expected.length), `${step}: length`);
      assert.dom('#first').hasText(expected[0] ?? '', `${step}: firstObject`);
      assert.dom('#last').hasText(expected.at(-1) ?? '', `${step}: lastObject`);
    };

    await check(['a', 'b'], 'initial');

    list.pushObject('c');
    await check(['a', 'b', 'c'], 'pushObject');

    list.unshiftObject('z');
    await check(['z', 'a', 'b', 'c'], 'unshiftObject');

    list.removeAt(1);
    await check(['z', 'b', 'c'], 'removeAt');

    list.insertAt(1, 'y');
    await check(['z', 'y', 'b', 'c'], 'insertAt');

    list.popObject();
    await check(['z', 'y', 'b'], 'popObject');

    list.shiftObject();
    await check(['y', 'b'], 'shiftObject');

    list.reverseObjects();
    await check(['b', 'y'], 'reverseObjects');

    list.removeObject('b');
    await check(['y'], 'removeObject');

    list.addObjects(['y', 'x']);
    await check(['y', 'x'], 'addObjects');

    list.replace(0, 1, ['w', 'v']);
    await check(['w', 'v', 'x'], 'replace');

    list.setObjects(['q']);
    await check(['q'], 'setObjects');

    list.clear();
    await check([], 'clear');
  });

  test('updates after set and incrementProperty', async function (assert) {
    const list = A([]);

    list.set('title', 'one');
    list.set('count', 0);

    await render(
      <template>
        <output id="title">{{list.title}}</output>
        <output id="count">{{list.count}}</output>
      </template>,
    );

    assert.dom('#title').hasText('one');

    list.set('title', 'two');
    list.incrementProperty('count');
    await settled();

    assert.dom('#title').hasText('two');
    assert.dom('#count').hasText('1');
  });
});
