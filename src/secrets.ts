import * as crypto from "crypto";
import * as redis from "./redis";
import * as config from "./config";

const { SECRETS_KEY, SECRET_LENGTH } = config.get();

type Secrets = {
  old: string;
  current: string;
}

const generateSecret = (): string => crypto.randomBytes(SECRET_LENGTH / 2).toString("hex");

const generateNewSecrets = (old: Secrets | null) => ({
  old: !!old
    ? old.current
    : generateSecret(),
  current: generateSecret(),
})

export const rotate = async () => {
  const oldValues = await get();

  const newValues = generateNewSecrets(oldValues);
  
  await redis.set(SECRETS_KEY, JSON.stringify(newValues));
}

export const getString = () => redis.get(SECRETS_KEY);
export const get = async (): Promise<Secrets> => {
  const s = await getString();
  return JSON.parse(s);
}
export const getCurrent = async () => {
  const { current } = await get();
  return current;
}
export const getOld = async () => {
  const { old } = await get();
  return old;
}
