import * as crypto from "crypto";
import * as redis from "./redis";
import * as config from "./config";
import keypair from "keypair";

const { SECRETS_KEY, SECRET_LENGTH, ASYMMETRIC_SIGNING } = config.get();

type Secrets = {
  old: Key;
  current: Key;
}

interface PublicSecrets {
  old: string;
  current: string;
}

interface PrivateSecrets extends PublicSecrets {}

interface Key {
  publicKey: string;
  privateKey: string;
}

export const generateAsymmetricSecret = (): Promise<Key> => new Promise(resolve => {
  const kp = keypair();
  resolve({
    publicKey: kp["public"],
    privateKey: kp["private"],
  })
});

export const generateSymmetricSecret = async (): Promise<Key> => {
  const k = crypto.randomBytes(SECRET_LENGTH / 2).toString("hex");
  return { publicKey: k, privateKey: k };
}

export const generateNewSecrets = async (old: Secrets | null, asymmetric = ASYMMETRIC_SIGNING) => {
  const gen = asymmetric ? generateAsymmetricSecret : generateSymmetricSecret;

  return {
    old: !!old
      ? old.current
      : await gen(),
    current: await gen(),
  }
}

export const rotate = async (first = false) => {
  const oldValues = first ? null : await get();

  const newValues = await generateNewSecrets(oldValues);
  
  await redis.set(SECRETS_KEY, JSON.stringify(newValues));
}

const getString = async () => {
  const result = await redis.get(SECRETS_KEY);
  if (!result) {
    await rotate(true);
    return await redis.get(SECRETS_KEY);
  }

  return result;
}

export const get = async (): Promise<Secrets> => {
  const s = await getString();
  return JSON.parse(s);
}

export const getPrivate = async (): Promise<PrivateSecrets> => {
  const { current, old } = await get();
  return {
    current: current.privateKey,
    old: old.privateKey
  }
}

export const getOldPrivate = async () => {
  const { old } = await getPrivate();
  return old;
}

export const getCurrentPrivate = async () => {
  const { current } = await getPrivate();
  return current;
}

export const getPublic = async (): Promise<PublicSecrets> => {
  const { current, old } = await get();
  return {
    current: current.publicKey,
    old: old.publicKey
  }
}

export const getCurrentPublic = async () => {
  const { current } = await getPublic();
  return current;
}

export const getOldPublic = async () => {
  const { old } = await getPublic();
  return old;
}
