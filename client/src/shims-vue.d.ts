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
  export default function TiltedBoxPlugin(T: Object): any;
}
declare module 'vue-json-viewer' {
  import { AllowedComponentProps, App, Component, ComponentCustomProps, VNodeProps } from 'vue';
  interface JsonViewerProps {
    value: Object | Array<any> | string | number | boolean;
    expanded: boolean;
    expandDepth: number;
    copyable: boolean | object;
    sort: boolean;
    boxed: boolean;
    theme: string;
    previewMode: boolean;
    timeformat: (value: any) => string;
  }
  type JsonViewerType = JsonViewerProps & VNodeProps & AllowedComponentProps & ComponentCustomProps;
  const JsonViewer: Component<JsonViewerType>;
  export { JsonViewer };
  const def: { install: (app: App) => void };
  export default def;
}