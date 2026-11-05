import Component from '@glimmer/component';
import { on } from '@ember/modifier';
import { A, type NativeArray } from '@ember/array';

export default class ItemList extends Component {
  items: NativeArray<string> = A(['item-0']);

  add = () => this.items.pushObject(`item-${this.items.length}`);

  removeFirst = () => this.items.shiftObject();

  <template>
    <button type="button" data-test-add {{on "click" this.add}}>add</button>
    <button type="button" data-test-remove {{on "click" this.removeFirst}}>
      remove
    </button>
    <p data-test-first>{{this.items.firstObject}}</p>
    <p data-test-last>{{this.items.lastObject}}</p>
    <ul>
      {{#each this.items as |item|}}
        <li>{{item}}</li>
      {{/each}}
    </ul>
  </template>
}
