import { KeyValueStorage } from "./KeyValueStorage";

export function getMockKvStorage(): KeyValueStorage {
  const map = new Map<string, string>();
  
  return {
  
    async get(key: string) {
      return map.get(key) ?? null;
    },

    async set(key: string, value: string) {
      map.set(key, value);
    }

  }
}