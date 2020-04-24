import Signer from "."
import { KeyValueStorage } from "./KeyValueStorage";
import { SignerConfig } from "./Signer";
import { getMockKvStorage } from "./KeyValueStorage.mock";
import mockdate from "mockdate";

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

    async function getInMemorySigner(mode: SignerConfig["mode"], rotationInterval: number | null = 300 * 1000): Promise<WithInMemorySignerDeps> {
      const kv = getMockKvStorage();
      const signer = await Signer.fromKvStorage<{ uid: string }>(kv, {
        mode,
        rotationInterval,
        secretLength: 20,
        tokenExpiry: rotationInterval ?? 300 * 1000
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
  
    describe("when disabled", () => {
      it("no timer is set", () => withInMemorySigner("asymmetric", null)(async ({ signer }) => {
        expect(jest.getTimerCount()).toBe(0);
      }))
    });

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

        describe("authentication flow", () => {
          describe("lucky path", () => {
            test("current token works", () => withInMemorySigner(mode)(async ({ signer }) => {
              const jwtRepo = signer.getJwtRepository();
              
              const payload = { uid: "johndoe" };
              const token = await jwtRepo.sign(payload);
        
              const payloadFromToken = await jwtRepo.verify(token);
              expect(payloadFromToken).not.toBeNull();
        
              const { uid } = payloadFromToken!;
              expect(uid).toBe(payload.uid);
            }));

            test("old token works", () => withInMemorySigner(mode)(async ({ signer }) => {
              const jwtRepo = signer.getJwtRepository();
              
              const payload = { uid: "johndoe" };
              const token = await jwtRepo.sign(payload);

              await signer.rotate();
        
              const payloadFromToken = await jwtRepo.verify(token);
              expect(payloadFromToken).not.toBeNull();
        
              const { uid } = payloadFromToken!;
              expect(uid).toBe(payload.uid);
            }));
          });

          describe("unlucky path", () => {
            test("non-legit token", () => withInMemorySigner(mode)(async ({ signer }) => {
              const jwtRepo = signer.getJwtRepository();
              const result = await jwtRepo.verify("weirdintrudertoken");
              expect(result).toBeNull();
            }));

            test("expired token", () => withInMemorySigner(mode)(async ({ signer }) => {
              mockdate.set(new Date(1580, 1, 1));

              const jwtRepo = signer.getJwtRepository();
              
              const payload = { uid: "johndoe" };
              const token = await jwtRepo.sign(payload);

              mockdate.set(new Date(2020, 1, 1));

              const result = await jwtRepo.verify(token);
              expect(result).toBeNull();
            }));
          })

          
        })
        
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