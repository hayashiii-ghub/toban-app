import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { schedules } from "../db/schema";

const SLUG_PATTERN = /^[a-zA-Z0-9_-]{10,128}$/;

export { SLUG_PATTERN };

// SHA-256ハッシュ（Web Crypto API）
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// 定数時間文字列比較（タイミング攻撃防止）
export function timingSafeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let result = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    result |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return result === 0;
}

// 編集トークンは SHA-256 のハッシュだけを保存している
export async function verifyToken(
  row: { editTokenHash: string | null },
  token: string
): Promise<boolean> {
  if (!row.editTokenHash) return false;
  return timingSafeEqual(await hashToken(token), row.editTokenHash);
}

// トークン検証付きでスケジュールを取得するヘルパー
export async function authenticateEditRequest(c: {
  req: {
    param(name: string): string;
    header(name: string): string | undefined;
  };
  json: (data: unknown, status: number) => Response;
  env: { DB: D1Database };
}) {
  const slug = c.req.param("slug");
  if (!SLUG_PATTERN.test(slug)) {
    return { error: c.json({ error: "Invalid slug" }, 400) };
  }

  const token = c.req.header("x-edit-token");
  if (!token) {
    return { error: c.json({ error: "Edit token required" }, 401) };
  }

  const db = drizzle(c.env.DB);

  const [row] = await db
    .select({ editTokenHash: schedules.editTokenHash })
    .from(schedules)
    .where(eq(schedules.slug, slug))
    .limit(1);

  // スケジュールの存在有無に関わらず同じ 403 を返す（slug の存在を推測させない）
  if (!row || !(await verifyToken(row, token))) {
    return { error: c.json({ error: "Unauthorized" }, 403) };
  }

  return { slug, db };
}
