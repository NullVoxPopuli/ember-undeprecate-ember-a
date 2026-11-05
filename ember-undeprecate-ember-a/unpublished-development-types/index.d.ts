declare module '@glimmer/validator' {
  export interface Tag {
    readonly __brand: 'Tag';
  }
  export function tagFor(obj: object, key: string): Tag;
  export function consumeTag(tag: Tag): void;
}
