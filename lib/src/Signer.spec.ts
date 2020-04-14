import Signer from "."
import { KeyValueStorage } from "./KeyValueStorage";

describe("Signer", () => {
  async function getInMemorySigner<T extends object>() {
    const map = new Map<string, string>();
    const kvStorage: KeyValueStorage = {

      async get(key: string) {
        return map.get(key) ?? null;
      },

      async set(key: string, value: string) {
        map.set(key, value);
      }

    }
    const signer = await Signer.fromKvStorage<T>(kvStorage, {
      mode: "asymmetric",
      rotationInterval: 300,
      secretLength: 20,
      tokenExpiry: 400
    });

    return {
      map,
      kv: kvStorage,
      signer
    };
  }

  describe("#JwtRepository", () => {
    test("authentication flow", async () => {
      const { signer } = await getInMemorySigner<{ uid: string }>();
      const jwtRepo = signer.getJwtRepository();
      
      const payload = { uid: "johndoe" };
      const token = await jwtRepo.sign(payload);

      const payloadFromToken = await jwtRepo.verify(token);
      expect(payloadFromToken).toEqual(payload);
    });

    test("blocking flow", async () => {
      const { signer } = await getInMemorySigner<{ uid: string }>();
      const jwtRepo = signer.getJwtRepository();
      
      const payload = { uid: "johndoe" };
      const token = await jwtRepo.sign(payload);

      await jwtRepo.block(token);

      const payloadFromToken = await jwtRepo.verify(token);
      expect(payloadFromToken).toBe(null);
    });
  })
})