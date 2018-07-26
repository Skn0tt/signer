import { generateSymmetricSecret, generateAsymmetricSecret, generateNewSecrets } from "./secrets";
import JWT from "jsonwebtoken";

describe("Secrets", () => {

  describe("generateNewSecrets", () => {

    describe("sync", () => {
      it("rotates", async () => {
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
        const newSecrets = await generateNewSecrets(old, false);
  
        expect(newSecrets.old).toEqual(old.current);
      })
    })

    describe("async", () => {
      it("rotates", async () => {
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
        const newSecrets = await generateNewSecrets(old, true);
  
        expect(newSecrets.old).toEqual(old.current);
      })
    })
    
  })

  describe("generateSymmetricSecret", () => {
    
    it("works", async () => {
      const { privateKey, publicKey } = await generateSymmetricSecret();
      expect(privateKey).toEqual(publicKey);
    })

    it("works with `jsonwebtoken`", async () => {
      const { privateKey, publicKey } = await generateSymmetricSecret();
      const payload = { user: "Simon" };
      const token = JWT.sign(payload, privateKey);
      const decoded = JWT.verify(token, publicKey) as typeof payload;
      expect(payload.user).toEqual(decoded.user);
    })

  })

  describe("generateAsymmmetricSecret", () => {

    it("works", async () => {
      const { privateKey, publicKey } = await generateAsymmetricSecret();
      expect(privateKey).not.toEqual(publicKey);
    })

    it("works with `jsonwebtoken`", async () => {
      const { privateKey, publicKey } = await generateAsymmetricSecret();
      const payload = { user: "Simon" };
      const token = JWT.sign(payload, privateKey, { algorithm: "RS256" });
      const decoded = JWT.verify(token, publicKey) as typeof payload;
      expect(payload.user).toEqual(decoded.user);
    })

  })

})