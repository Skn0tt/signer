import type { Secrets } from "./secrets";
import type { KeyValueStorage } from "./KeyValueStorage";
import * as JWT from "jsonwebtoken";
import type { SignerConfig } from "./Signer";

type VerificationError = JWT.JsonWebTokenError | JWT.TokenExpiredError;
const isTokenExpiredError = (e: VerificationError): e is JWT.TokenExpiredError => e.name === "TokenExpiredError";

const ASYMMETRIC_ALGORITHM = "RS256";

export class JWTRepository<Payload extends string | object | Buffer> {

  constructor(
    private readonly getSecrets: () => Promise<Secrets>,
    private readonly kv: KeyValueStorage,
    private readonly config: SignerConfig
  ) {}

  public async sign(payload: Payload): Promise<string> {
    const { current: { privateKey } } = await this.getSecrets();

    const options: JWT.SignOptions = {
      expiresIn: this.config.tokenExpiry,
    }

    if (this.config.mode === "asymmetric") {
      options.algorithm = ASYMMETRIC_ALGORITHM;
    }

    return JWT.sign(payload, privateKey, options);
  }

  public isBlocked(token: string) {
    const value = this.kv.get(token);
    return !!value;
  }

  public async block(token: string) {
    await this.kv.set(token, "blocked", this.config.tokenExpiry);
  }

  public async verify(token: string): Promise<Payload | null> {
    if (this.isBlocked(token)) {
      return null;
    }

    const { current: { publicKey: currentPublicKey }, old: { publicKey: oldPublicKey } } = await this.getSecrets();
    const check = (secret: string) => {
      if (this.config.mode === "asymmetric") {
        return JWT.verify(token, secret, { algorithms: [ ASYMMETRIC_ALGORITHM ] });
      } else {
        return JWT.verify(token, secret);
      }
    }

    try {
      const payload = check(currentPublicKey);
      return payload as Payload;
    } catch (e) {
      const error = e as VerificationError;
      if (isTokenExpiredError(error)) {
        return null;
      }
      
      try {
        const payload = check(oldPublicKey);
        return payload as Payload;
      } catch (e) {
        const error = e as VerificationError;
        return null;
      }
    }
  }

}