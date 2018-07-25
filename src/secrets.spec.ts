import { generateSecret } from "./secrets";

describe("Secrets", () => {
  test("generateSecret", () => {
    const s = generateSecret();
    expect(s).toBeInstanceOf(String);
  })
})