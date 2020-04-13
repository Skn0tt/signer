type Config = {
  REDIS_HOSTNAME: string;
  REDIS_PORT: number;
  SECRETS_KEY: string;
  SECRET_LENGTH: number;
  TOKEN_EXPIRY: number;
  ASYMMETRIC_SIGNING: boolean;
  ROTATION_INTERVAL: number;
  ROTATE_ON_STARTUP: boolean;
  DISABLE_ROTATING: boolean; 
}

let config: Config | null = null;

const toNumber = (v?: string) => !!v ? +v : undefined;

export const get = (): Config => {
  if (!config) {
    const { env } = process;

    config = {
      REDIS_HOSTNAME: env.REDIS_HOSTNAME || "",
      REDIS_PORT: toNumber(env.REDIS_PORT) || 6379,
      SECRET_LENGTH: toNumber(env.SECRET_LENGTH) || 96,
      SECRETS_KEY: env.SECRETS_KEY || "SECRETS",
      TOKEN_EXPIRY: toNumber(env.TOKEN_EXPIRY) || 60 * 60,
      ROTATION_INTERVAL: toNumber(env.ROTATION_INTERVAL) || 60 * 60,
      DISABLE_ROTATING: env.DISABLE_ROTATING === "true",
      ROTATE_ON_STARTUP: env.ROTATE_ON_STARTUP === "true",
      ASYMMETRIC_SIGNING: env.ASYMMETRIC_SIGNING === "true",
    }
  }

  return config!;
}

export const validate = () => {
  const { SECRET_LENGTH, REDIS_HOSTNAME } = get();

  if (SECRET_LENGTH < 1) {
    throw new Error("SECRET_LENGTH must be positive.");
  }

  if (REDIS_HOSTNAME === "") {
    throw new Error("REDIS_HOSTNAME must be set.");
  }
}
