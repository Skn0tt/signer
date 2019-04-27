import * as redis from "redis";
import * as config from "./config";

const { REDIS_HOSTNAME, REDIS_PORT } = config.get();

let _client: redis.RedisClient | null = null;
const client = () => _client!;
export const connect = () => _client = redis.createClient(`redis://${REDIS_HOSTNAME}:${REDIS_PORT}`);

export const get = (key: string) => new Promise<string>((resolve, reject) => {
  client().get(key, (err, reply) => {
    if (err) {
      reject(err);
    }

    resolve(reply);
  })
})

export const has = (key: string) => new Promise<boolean>((resolve, reject) => {
  client().exists(key, (err, reply) => {
    if (!!err) {
      reject(err);
    }
    
    resolve(reply === 1);
  })
})

export const remove = (key: string) => new Promise<void>((resolve, reject) => {
  client().del(key, err => {
    if (!!err) {
      reject(err);
    }

    resolve();
  })
})

export const set = (key: string, value: string, expiry?: number) => new Promise<void>((resolve, reject) => {
  const callback = err => !!err ? reject(err) : resolve();
  if (!!expiry) {
    client().set(key, value, "EXPIRE", expiry, callback);
  } else {
    client().set(key, value);
  }
})

export const isHealthy = () =>
  new Promise<boolean>(resolve => {
    let finished = false;
    
    setTimeout(
      () => {
        if (!finished) {
          finished = true;
          resolve(false);
        }
      },
      1000
    );

    client().ping(() => {
      if (!finished) {
        finished = true;
        resolve(true);
      }
    });
  })
