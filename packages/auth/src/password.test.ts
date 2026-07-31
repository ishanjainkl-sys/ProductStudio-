import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";

describe("password hashing", () => {
  it("hashes and verifies with argon2id", async () => {
    const hash = await hashPassword("correct-horse-battery");
    expect(hash).not.toContain("correct-horse");
    expect(await verifyPassword(hash, "correct-horse-battery")).toBe(true);
    expect(await verifyPassword(hash, "wrong")).toBe(false);
  });
});
