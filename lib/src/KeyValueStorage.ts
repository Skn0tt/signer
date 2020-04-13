export interface KeyValueStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, expiry?: number): Promise<void>;
}