import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

vi.mock("./handlers/seo", async importOriginal => {
  const actual = await importOriginal<typeof import("./handlers/seo")>();
  return {
    ...actual,
    handleScheduleOgp: vi.fn().mockResolvedValue(
      new Response("<html><head></head><body>shared</body></html>", {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      })
    ),
  };
});

import worker, { HTML_SECURITY_HEADERS } from "./worker";

describe("撤去したページの転送（client/public/_redirects）", () => {
  // ブラウザのページ遷移は Worker を通らないので、転送は Worker ではなく静的アセットの _redirects に書く
  it("旧・順番決めページ /junban を /about へ 301 で転送する", () => {
    const rules = readFileSync("client/public/_redirects", "utf8");
    expect(rules).toMatch(/^\/junban \/about 301$/m);
  });
});

describe("ページ遷移に付けるヘッダー（client/public/_headers）", () => {
  // ブラウザのページ遷移は Worker を通らない。Worker と同じヘッダーが _headers にあるか見張る
  const rules = readFileSync("client/public/_headers", "utf8");
  const block = (path: string) =>
    rules.split(/\n(?=\S)/).find(b => b.startsWith(`${path}\n`)) ?? "";

  it("全ページに Worker と同じセキュリティヘッダーを付ける", () => {
    for (const [key, value] of Object.entries(HTML_SECURITY_HEADERS)) {
      expect(block("/*")).toContain(`  ${key}: ${value}`);
    }
  });

  it("共有ページは人が開いても noindex にする", () => {
    expect(block("/s/*")).toContain("  X-Robots-Tag: noindex");
  });
});

describe("SEO response policy", () => {
  it("Googlebot へ返す共有スケジュールを noindex にする", async () => {
    const request = new Request("https://toban.app/s/test-schedule", {
      headers: { "User-Agent": "Googlebot" },
    });
    const env = {
      ASSETS: { fetch: vi.fn() },
      DB: {},
      SLACK_WEBHOOK_URL: "",
    } as never;

    const response = await worker.fetch(request, env, {} as ExecutionContext);

    expect(response.headers.get("X-Robots-Tag")).toBe("noindex");
  });

  it("通常ブラウザへ返す共有スケジュールも noindex にする", async () => {
    const request = new Request("https://toban.app/s/test-schedule", {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const env = {
      ASSETS: {
        fetch: vi
          .fn()
          .mockImplementation(() =>
            fetch("data:text/html,<html><body>shared</body></html>")
          ),
      },
      DB: {},
      SLACK_WEBHOOK_URL: "",
    } as never;

    const response = await worker.fetch(request, env, {} as ExecutionContext);

    expect(response.headers.get("X-Robots-Tag")).toBe("noindex");
  });
});

describe("bot とそれ以外の振り分け", () => {
  const assetsResponse = () => new Response("asset", { status: 200 });

  function envWithAssets() {
    const assets = { fetch: vi.fn(async () => assetsResponse()) };
    return {
      env: { ASSETS: assets, DB: {}, SLACK_WEBHOOK_URL: "" } as never,
      assets,
    };
  }

  function get(path: string, userAgent: string) {
    return new Request(`https://toban.app${path}`, {
      headers: { "User-Agent": userAgent },
    });
  }

  it("bot には /about をプリレンダリングした HTML で返す", async () => {
    const { env, assets } = envWithAssets();
    const res = await worker.fetch(
      get("/about", "Googlebot"),
      env,
      {} as ExecutionContext
    );
    expect(res.headers.get("Content-Type")).toContain("text/html");
    expect(await res.text()).toContain("<h1");
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
    expect(assets.fetch).not.toHaveBeenCalled();
  });

  it("bot が知らないページを踏んだら 404 を返す（SPA の 200 で soft-404 にしない）", async () => {
    const { env, assets } = envWithAssets();
    const res = await worker.fetch(
      get("/no-such-page", "Googlebot"),
      env,
      {} as ExecutionContext
    );
    expect(res.status).toBe(404);
    expect(assets.fetch).not.toHaveBeenCalled();
  });

  it("拡張子付きのパス（ads.txt など）は bot にも静的ファイルとして渡す", async () => {
    const { env, assets } = envWithAssets();
    const res = await worker.fetch(
      get("/ads.txt", "Mediapartners-Google"),
      env,
      {} as ExecutionContext
    );
    expect(res.status).toBe(200);
    expect(assets.fetch).toHaveBeenCalledOnce();
  });

  it("静的ページの /privacy は bot にも 404 を返さず静的ファイルに渡す", async () => {
    const { env, assets } = envWithAssets();
    const res = await worker.fetch(
      get("/privacy", "Mediapartners-Google"),
      env,
      {} as ExecutionContext
    );
    expect(res.status).toBe(200);
    expect(assets.fetch).toHaveBeenCalledOnce();
  });

  it("人には知らないページも SPA に任せる", async () => {
    const { env, assets } = envWithAssets();
    const res = await worker.fetch(
      get("/no-such-page", "Mozilla/5.0"),
      env,
      {} as ExecutionContext
    );
    expect(res.status).toBe(200);
    expect(assets.fetch).toHaveBeenCalledOnce();
  });
});

describe("1 年使われていない当番表の削除（scheduled）", () => {
  it("編集が 1 年なくても、カレンダーから読まれている表は消さない", async () => {
    const statements: { sql: string; params: unknown[] }[] = [];
    const DB = {
      prepare(sql: string) {
        const stmt = {
          params: [] as unknown[],
          bind(...params: unknown[]) {
            stmt.params = params;
            return stmt;
          },
          async run() {
            statements.push({ sql, params: stmt.params });
            return { results: [], success: true, meta: { changes: 0 } };
          },
        };
        return stmt;
      },
    } as unknown as D1Database;

    await worker.scheduled(
      {} as ScheduledEvent,
      { DB } as Parameters<typeof worker.scheduled>[1],
      {} as ExecutionContext
    );

    expect(statements).toHaveLength(1);
    const [{ sql, params }] = statements;
    expect(sql).toMatch(/^delete from "schedules"/);
    expect(sql).toContain('"updated_at" < ?');
    expect(sql).toContain('"calendar_accessed_at" is null');
    expect(sql).toContain('"calendar_accessed_at" < ?');
    // どちらも同じ「1 年前」で比べる
    expect(params[0]).toBe(params[1]);
  });
});
