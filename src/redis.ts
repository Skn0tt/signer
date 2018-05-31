import * as redis from "redis";
import * as config from "./config";

const { REDIS_HOSTNAME, REDIS_PORT } = config.get();

const client = redis.createClient(`redis://${REDIS_HOSTNAME}:${REDIS_PORT}`);

export const get = (key: string) => new Promise<string>((resolve, reject) => {
  client.get(key, (err, reply) => {
    if (err) {
      reject(err);
    }

    resolve(reply);
  })
})

export const set = (key: string, value: string) => new Promise<"OK">((resolve, reject) => {
  client.set(key, value, (err, reply) => {
    if (err) {
      reject(err);
    }

    resolve(reply);
  })
})
