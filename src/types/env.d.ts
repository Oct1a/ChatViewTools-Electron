/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module "vue" {
  import { Component } from "vue";
  export { ref, computed, onMounted } from "vue";
  export interface ComponentCustomProperties {
    $ref: typeof import("vue").ref;
    $computed: typeof import("vue").computed;
    $onMounted: typeof import("vue").onMounted;
  }
}

declare module "@element-plus/icons-vue" {
  import type { Component } from "vue";
  const component: Component;
  export default component;
  export const Search: Component;
} 