import * as redis from "redis";
import * as config from "./config";

const { REDIS_HOST } = config.get();

const client = redis.createClient(`redis://${REDIS_HOST}`);

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
