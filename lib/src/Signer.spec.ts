import Signer from "."
import { KeyValueStorage } from "./KeyValueStorage";
import { SignerConfig } from "./Signer";
import { getMockKvStorage } from "./KeyValueStorage.spec";

jest.useFakeTimers();
jest.setTimeout(100);

function waitForNextCycle() {
  return new Promise<void>(resolve => {
    setImmediate(resolve);
  })
}

describe("Signer", () => {

  interface WithInMemorySignerDeps {
    kv: KeyValueStorage;
    signer: Signer<{ uid: string }>;
  }

  function withInMemorySigner(...args: Parameters<typeof getInMemorySigner>) {

    async function getInMemorySigner(mode: SignerConfig["mode"], rotationInterval = 300 * 1000): Promise<WithInMemorySignerDeps> {
      const kv = getMockKvStorage();
      const signer = await Signer.fromKvStorage<{ uid: string }>(kv, {
        mode,
        rotationInterval,
        secretLength: 20,
        tokenExpiry: rotationInterval
      });
  
      return { kv, signer };
    }

    return async function (test: (deps: WithInMemorySignerDeps) => Promise<void>) {
      const deps = await getInMemorySigner(...args);
      await test(deps);
      deps.signer.close();
    }
  }

  describe("rotation", () => {
    it("works", () => withInMemorySigner("asymmetric")(async ({ signer }) => {
      const currentSecrets = await signer.getPublic();
      await signer.rotate();
      const newSecrets = await signer.getPublic();

      expect(currentSecrets.current).toEqual(newSecrets.old);
      expect(currentSecrets).not.toEqual(newSecrets);
    }));

    it("happens after specified timeout", () => withInMemorySigner("asymmetric")(async ({ signer }) => {
      const currentSecrets = await signer.getPublic();

      jest.runOnlyPendingTimers();
      await waitForNextCycle();

      const rotatedSecrets = await signer.getPublic();

      expect(currentSecrets).not.toEqual(rotatedSecrets);
    }));
  })

  describe("#JwtRepository", () => {

    function describeJwtRepository(mode: SignerConfig["mode"]) {
      describe(`mode: ${mode}`, () => {
        test("authentication flow", () => withInMemorySigner(mode)(async ({ signer }) => {
          const jwtRepo = signer.getJwtRepository();
          
          const payload = { uid: "johndoe" };
          const token = await jwtRepo.sign(payload);
    
          const payloadFromToken = await jwtRepo.verify(token);
          expect(payloadFromToken).not.toBeNull();
    
          const { uid } = payloadFromToken!;
          expect(uid).toBe(payload.uid);
        }));
    
        test("blocking flow", () => withInMemorySigner(mode)(async ({ signer }) => {
          const jwtRepo = signer.getJwtRepository();
          
          const payload = { uid: "johndoe" };
          const token = await jwtRepo.sign(payload);
    
          await jwtRepo.block(token);
    
          const payloadFromToken = await jwtRepo.verify(token);
          expect(payloadFromToken).toBe(null);
        }));
      })
    }

    describeJwtRepository("symmetric");
    describeJwtRepository("asymmetric");
  })
})