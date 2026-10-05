import { describe, expect, it } from "vitest";
import app from "./api";

// server/db/ensureSchema.ts の REQUIRED_SCHEDULE_COLUMNS と同じ列
const REQUIRED_COLUMNS = [
  "edit_token_hash",
  "rotation_config_json",
  "assignment_mode",
  "design_theme_id",
  "font_id",
  "is_public",
  "calendar_accessed_at",
];

/** PRAGMA table_info(schedules) だけに答える D1 の偽物 */
function fakeDb(columns: string[]) {
  return {
    prepare: () => ({
      all: async () => ({ results: columns.map(name => ({ name })) }),
    }),
  } as unknown as D1Database;
}

function env(overrides: Record<string, unknown> = {}) {
  return { DB: fakeDb(REQUIRED_COLUMNS), SLACK_WEBHOOK_URL: "", ...overrides };
}

// レート制限は IP とメソッドごとにモジュール内で数えるので、テストごとに IP を分ける
function request(
  ip: string,
  path: string,
  init: RequestInit = {},
  bindings = env()
) {
  const headers = new Headers(init.headers);
  headers.set("cf-connecting-ip", ip);
  return app.request(path, { ...init, headers }, bindings);
}

describe("API の共通処理", () => {
  it("本番の Origin だけに CORS を許可する", async () => {
    const allowed = await request("203.0.113.1", "/api/health/schema", {
      headers: { Origin: "https://toban.app" },
    });
    expect(allowed.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://toban.app"
    );

    const denied = await request("203.0.113.1", "/api/health/schema", {
      headers: { Origin: "http://localhost:3000" },
    });
    expect(denied.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("ENVIRONMENT=development のときだけ localhost を許可する", async () => {
    const res = await request(
      "203.0.113.2",
      "/api/health/schema",
      { headers: { Origin: "http://localhost:3000" } },
      env({ ENVIRONMENT: "development" })
    );
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "http://localhost:3000"
    );
  });

  it("セキュリティヘッダーを付ける", async () => {
    const res = await request("203.0.113.3", "/api/health/schema");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
    expect(res.headers.get("Strict-Transport-Security")).toContain("max-age=");
  });

  it("100KB を超える本文は 413 で断る", async () => {
    const res = await request("203.0.113.4", "/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "x".repeat(100 * 1024 + 1),
    });
    expect(res.status).toBe(413);
  });

  it("同じ IP からの POST は 1 分に 10 回までで、超えると 429 と Retry-After を返す", async () => {
    for (let i = 0; i < 10; i++) {
      const res = await request("203.0.113.5", "/api/health/schema", {
        method: "POST",
      });
      expect(res.status).not.toBe(429);
    }

    const limited = await request("203.0.113.5", "/api/health/schema", {
      method: "POST",
    });
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get("Retry-After"))).toBeGreaterThan(0);

    // 数える単位は IP ごと
    const other = await request("203.0.113.6", "/api/health/schema", {
      method: "POST",
    });
    expect(other.status).not.toBe(429);
  });
});

describe("GET /api/health/schema", () => {
  it("必要な列がそろっていれば 200 を返し、キャッシュも index もさせない", async () => {
    const res = await request("203.0.113.7", "/api/health/schema");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.headers.get("X-Robots-Tag")).toBe("noindex");
  });

  it("列が足りなければ 503 を返す", async () => {
    const res = await request(
      "203.0.113.8",
      "/api/health/schema",
      {},
      env({ DB: fakeDb(REQUIRED_COLUMNS.slice(1)) })
    );
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ ok: false });
  });
});
