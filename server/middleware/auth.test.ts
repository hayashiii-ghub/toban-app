import { describe, it, expect } from "vitest";
import { hashToken, timingSafeEqual, verifyToken } from "./auth";

describe("hashToken", () => {
  it("returns consistent SHA-256 hex string", async () => {
    const hash1 = await hashToken("test-token");
    const hash2 = await hashToken("test-token");
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns different hashes for different inputs", async () => {
    const hash1 = await hashToken("token-a");
    const hash2 = await hashToken("token-b");
    expect(hash1).not.toBe(hash2);
  });
});

describe("timingSafeEqual", () => {
  it("returns true for equal strings", () => {
    expect(timingSafeEqual("abc", "abc")).toBe(true);
  });

  it("returns false for different strings", () => {
    expect(timingSafeEqual("abc", "def")).toBe(false);
  });

  it("returns false for different lengths", () => {
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
  });

  it("returns true for empty strings", () => {
    expect(timingSafeEqual("", "")).toBe(true);
  });
});

describe("verifyToken", () => {
  it("validates against editTokenHash", async () => {
    const token = "my-secret-token";
    const hash = await hashToken(token);
    expect(await verifyToken({ editTokenHash: hash }, token)).toBe(true);
  });

  it("rejects wrong token against hash", async () => {
    const hash = await hashToken("correct-token");
    expect(await verifyToken({ editTokenHash: hash }, "wrong-token")).toBe(
      false
    );
  });

  it("rejects a row without a hash", async () => {
    expect(await verifyToken({ editTokenHash: null }, "any-token")).toBe(false);
  });
});
