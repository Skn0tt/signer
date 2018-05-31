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
  const oldValues = JSON.parse(await get());

  const newValues = generateNewSecrets(oldValues);
  
  await redis.set(SECRETS_KEY, JSON.stringify(newValues));
}

export const get = () => redis.get(SECRETS_KEY);
