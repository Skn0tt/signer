import * as JWT from "jsonwebtoken";
import * as secrets from "./secrets";
import * as redis from "./redis";
import * as config from "./config";

const { ASYMMETRIC_SIGNING, TOKEN_EXPIRY } = config.get();

const ASYMMETRIC_ALGORITHM = "RS256"

const baseSignOptions: JWT.SignOptions = {
  expiresIn: TOKEN_EXPIRY,
}

const jwtSign = (payload: string | object | Buffer, secret: string) =>
  ASYMMETRIC_SIGNING
    ? JWT.sign(payload, secret, { ...baseSignOptions, algorithm: ASYMMETRIC_ALGORITHM })
    : JWT.sign(payload, secret, baseSignOptions)

export const sign = async (body: string | object | Buffer) => {
  const s = await secrets.getCurrentPrivate();
  const token = await jwtSign(body, s);
  return token;
}

export const block = (token: string) => redis.set(token, "blocked");

const isBlocked = redis.has

type VerificationError = JWT.JsonWebTokenError | JWT.TokenExpiredError

const isTokenExpiredError = (e: VerificationError): e is JWT.TokenExpiredError => e.name === "TokenExpiredError"

const jwtVerify = (token: string, secret: string) =>
  ASYMMETRIC_SIGNING
    ? JWT.verify(token, secret, { algorithms: [ ASYMMETRIC_ALGORITHM ] })
    : JWT.verify(token, secret)

export const verify = async (token: string): Promise<[boolean, string | object]> => {
  if (await isBlocked(token)) {
    return [false, "Token Blocked"];
  }
  
  const { current, old } = await secrets.getPublic();

  const check = (secret: string) => jwtVerify(token, secret);

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