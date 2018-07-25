import * as JWT from "jsonwebtoken";
import * as secrets from "./secrets";
import * as redis from "./redis";

export const sign = async (body: string | object | Buffer) => {
  const s = await secrets.getCurrent();
  const token = await JWT.sign(body, s);
  await redis.set(token, "true");
  return token;
}

export const block = async (token: string) => {
  await redis.remove(token);
}

type VerificationError = JWT.JsonWebTokenError | JWT.TokenExpiredError

const isTokenExpiredError = (e: VerificationError): e is JWT.TokenExpiredError => e.name === "TokenExpiredError"

export const verify = async (token: string): Promise<[boolean, string | object]> => {
  const tokenKnown = await redis.has(token);
  if (!tokenKnown) {
    return [false, "Token Unknown"];
  }
  
  const { current, old } = await secrets.get();

  const check = (secret: string) => JWT.verify(token, secret);

  try {
    const payload = check(current);
    return [true, payload];
  } catch (e) {
    const error = e as VerificationError;
    if (isTokenExpiredError(error)) {
      return [false, error.message];
    }
    
    try {
      const payload = check(old);
      return [true, payload];
    } catch (e) {
      const error = e as VerificationError;
      return [false, error.message];
    }
  }
}