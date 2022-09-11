/* eslint-disable */
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
declare module '@recogito/annotorious' {
  export class Annotorious {
    constructor(T: Object | null);
  }
}
declare module '@recogito/annotorious-tilted-box' {
  export default function TiltedBoxPlugin(T:Object):any
}
