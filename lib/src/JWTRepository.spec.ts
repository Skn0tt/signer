import { JWTRepository } from "./JWTRepository"
import { getMockKvStorage } from "./KeyValueStorage.spec"
import { decode } from "jsonwebtoken";
import mockdate from "mockdate";

describe("JWTRepository", () => {
  describe("when creating a token", () => {
    it("will expire according to `tokenExpiry`", async () => {
      mockdate.set(new Date(2020, 4, 24, 20, 15));

      const tokenExpiry = 30000;
      const key = "abcdefg";
      const jwtRepo = new JWTRepository(
        async () => ({
          current: {
            privateKey: key,
            publicKey: key
          },
          old: {
            privateKey: key,
            publicKey: key
          }
        }),
        getMockKvStorage(),
        {
          mode: "symmetric",
          tokenExpiry,
        }
      );

      const token = await jwtRepo.sign({ uid: "random" });
      const { exp } = decode(token) as { exp: number };

      const expectedExpiry = (Date.now() + tokenExpiry) / 1000;

      expect(exp).toEqual(expectedExpiry);

      mockdate.reset();
    })
  })
})