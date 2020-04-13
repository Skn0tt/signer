import { generateSymmetricSecret, generateAsymmetricSecret, generateNewSecrets } from "./secrets";
import JWT from "jsonwebtoken";

describe("Secrets", () => {

  describe("generateNewSecrets", () => {

    describe("sync", () => {
      it("rotates", () => {
        const old = {
          current: {
            privateKey: "A",
            publicKey: "B",
          },
          old: {
            privateKey: "C",
            publicKey: "D"
          }
        }
        const newSecrets = generateNewSecrets(old, false, 10);
  
        expect(newSecrets.old).toEqual(old.current);
      })
    })

    describe("async", () => {
      it("rotates", () => {
        const old = {
          current: {
            privateKey: "A",
            publicKey: "B",
          },
          old: {
            privateKey: "C",
            publicKey: "D"
          }
        }
        const newSecrets = generateNewSecrets(old, true, 10);
  
        expect(newSecrets.old).toEqual(old.current);
      })
    })
    
  })

  describe("generateSymmetricSecret", () => {
    
    it("works", () => {
      const { privateKey, publicKey } = generateSymmetricSecret(10);
      expect(privateKey).toEqual(publicKey);
    })

    it("works with `jsonwebtoken`", () => {
      const { privateKey, publicKey } = generateSymmetricSecret(10);
      const payload = { user: "Simon" };
      const token = JWT.sign(payload, privateKey);
      const decoded = JWT.verify(token, publicKey) as typeof payload;
      expect(payload.user).toEqual(decoded.user);
    })

  })

  describe("generateAsymmmetricSecret", () => {

    it("works", () => {
      const { privateKey, publicKey } = generateAsymmetricSecret();
      expect(privateKey).not.toEqual(publicKey);
    })

    it("works with `jsonwebtoken`", () => {
      const { privateKey, publicKey } = generateAsymmetricSecret();
      const payload = { user: "Simon" };
      const token = JWT.sign(payload, privateKey, { algorithm: "RS256" });
      const decoded = JWT.verify(token, publicKey) as typeof payload;
      expect(payload.user).toEqual(decoded.user);
    })

  })

})