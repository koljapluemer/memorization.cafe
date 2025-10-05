declare module 'dexie-cloud-addon' {
  import type { Dexie } from 'dexie';

  type DexieAddon = (db: Dexie) => void;

  const dexieCloudAddon: DexieAddon;
  export default dexieCloudAddon;
}
