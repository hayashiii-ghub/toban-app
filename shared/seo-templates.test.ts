import { describe, it, expect } from "vitest";
import {
  TEMPLATE_SEO_DATA,
  TEMPLATE_CATEGORIES,
  COMMON_FAQ,
  COMMON_FAQ_EN,
} from "./seo-templates";
import { TEMPLATES } from "./templates";

// 紹介ページを持たない唯一のテンプレート。空白から作り始めるためのもので、
// 書く内容が無いため SEO ページを作らない（中身の無い LP を増やさない）。
const CUSTOM_TEMPLATE_NAME = "カスタム（空白）";

describe("TEMPLATE_SEO_DATA", () => {
  it("カスタム以外のすべてのテンプレートが紹介ページを持つ", () => {
    const covered = new Set(TEMPLATE_SEO_DATA.map(t => t.templateIndex));
    const missing = TEMPLATES.map((t, i) => ({ name: t.name, i }))
      .filter(({ name, i }) => name !== CUSTOM_TEMPLATE_NAME && !covered.has(i))
      .map(({ name, i }) => `${i}: ${name}`);

    expect(missing, `LP が無いテンプレート: ${missing.join(", ")}`).toEqual([]);
  });

  it("カスタムテンプレートには紹介ページを作らない", () => {
    const customIndex = TEMPLATES.findIndex(t => t.name === CUSTOM_TEMPLATE_NAME);
    expect(customIndex).toBeGreaterThanOrEqual(0);
    expect(TEMPLATE_SEO_DATA.some(t => t.templateIndex === customIndex)).toBe(false);
  });

  it("slug と templateIndex が重複しない", () => {
    const slugs = TEMPLATE_SEO_DATA.map(t => t.slug);
    const indices = TEMPLATE_SEO_DATA.map(t => t.templateIndex);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(indices).size).toBe(indices.length);
  });

  it("categoryId が定義済みカテゴリを指す", () => {
    const known = new Set(TEMPLATE_CATEGORIES.map(c => c.id));
    const unknown = TEMPLATE_SEO_DATA.filter(t => !known.has(t.categoryId)).map(
      t => `${t.slug} -> ${t.categoryId}`
    );
    expect(unknown).toEqual([]);
  });
});

describe("COMMON_FAQ", () => {
  it("日本語と英語が同じ件数・同じ並びで対応する", () => {
    expect(COMMON_FAQ_EN).toHaveLength(COMMON_FAQ.length);
    expect(COMMON_FAQ_EN.every(f => f.question.length > 0 && f.answer.length > 0)).toBe(true);
  });
});
