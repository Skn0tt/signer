import { RedisClient } from "redis";

type Config = {
  PORT: number;
  REDIS_HOST: string;
  SECRETS_KEY: string;
  SECRET_LENGTH: number;
  ROTATION_PERIOD: number;
}

let config: Config | null = null;

const toNumber = (v?: string) => !!v ? +v : undefined;

export const get = (): Config => {
  if (!config) {
    const { env } = process;

    config = {
      REDIS_HOST: env.REDIS_HOST || "",
      SECRET_LENGTH: toNumber(env.SECRET_LENGTH) || 96,
      PORT: toNumber(env.PORT) || 80,
      SECRETS_KEY: env.SECRETS_KEY || "SECRETS",
      ROTATION_PERIOD: toNumber(env.ROTATION_PERIOD) || 60 * 60,
    }
  }

  return config!;
}

export const validate = () => {
  const { SECRET_LENGTH, PORT, REDIS_HOST } = get();

  if (SECRET_LENGTH < 1) {
    throw new Error("SECRET_LENGTH must be positive.");
  }

  if (REDIS_HOST === "") {
    throw new Error("REDIS_HOST must be set.");
  }

  if (PORT < 1) {
    throw new Error("PORT must be positive.");
  }
}
