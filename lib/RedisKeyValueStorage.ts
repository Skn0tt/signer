import { RedisClient } from "redis";
import { KeyValueStorage } from "./KeyValueStorage";

export class RedisKeyValueStorage implements KeyValueStorage {
  
  constructor(
    private readonly redis: RedisClient
  ) {}

  get(key: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.redis.get(key, (err, value) => {
        if (err) {
          reject(err);
        } else {
          resolve(value);
        }
      })
    });
  }

  set(key: string, value: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.redis.set(key, value, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      })
    })
  }

}