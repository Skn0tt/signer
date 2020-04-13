import * as crypto from "crypto";
import keypair from "keypair";
import { SignerConfig } from "./Signer";

interface Key {
  publicKey: string;
  privateKey: string;
}

export interface Secrets {
  old: Key;
  current: Key;
}

export function generateAsymmetricSecret() {
  const kp = keypair();
  return {
    publicKey: kp["public"],
    privateKey: kp["private"],
  }
};

export function generateSymmetricSecret(secretLength: number) {
  const k = crypto.randomBytes(secretLength / 2).toString("hex");
  return { publicKey: k, privateKey: k };
}

export function generateNewSecrets(old: Secrets | null, { mode, secretLength }: SignerConfig) {
  const gen = mode === "asymmetric" ? generateAsymmetricSecret : generateSymmetricSecret;

  return {
    old: !!old
      ? old.current
      : gen(secretLength),
    current: gen(secretLength),
  }
}