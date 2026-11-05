import { module, test } from 'qunit';
import { setupRenderingTest } from 'vite-app-with-v1-addon/tests/helpers';
import { click, render } from '@ember/test-helpers';
import { A } from 'ember-undeprecate-ember-a';
import { A as addonA } from 'v1-addon';
import ItemList from 'v1-addon/components/item-list';

module('Integration | v1-addon | item-list', function (hooks) {
  setupRenderingTest(hooks);

  test('the addon re-export resolves to ember-undeprecate-ember-a', function (assert) {
    assert.strictEqual(addonA, A);
  });

  test('uses A() inside the addon', async function (assert) {
    await render(<template><ItemList /></template>);

    assert.dom('li').exists({ count: 1 });

    await click('[data-test-add]');
    await click('[data-test-add]');

    assert.dom('li').exists({ count: 3 });
    assert.dom('[data-test-first]').hasText('item-0');
    assert.dom('[data-test-last]').hasText('item-2');

    await click('[data-test-remove]');

    assert.dom('li').exists({ count: 2 });
    assert.dom('[data-test-first]').hasText('item-1');
  });
});
