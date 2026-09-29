import { useEffect } from "react";
import { Link } from "wouter";
import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_CATEGORIES_EN,
  TEMPLATE_SEO_DATA,
  type TemplateSEO,
} from "@shared/seo-templates";
import { getTemplates } from "@shared/template-localization";
import { LpCtaLink } from "@/features/landing/LpCtaLink";
import { ChalkEdge, LpCtaBand, TemplateCard } from "@/features/landing/parts";
import { LP_COLORS as C, alpha } from "@/features/landing/theme";
import { MEMBER_PRESETS } from "@shared/appearance";
import {
  breadcrumbSchema,
  itemListSchema,
  serializeJsonLd,
} from "@shared/jsonLd";
import { useT, useLocale } from "@/i18n";
import { usePageMeta } from "@/hooks/usePageMeta";

const byCategory = new Map<string, TemplateSEO[]>();
for (const cat of TEMPLATE_CATEGORIES) byCategory.set(cat.id, []);
for (const t of TEMPLATE_SEO_DATA) byCategory.get(t.categoryId)?.push(t);

export default function TemplatesPage() {
  const t = useT();
  const { locale } = useLocale();
  const localizedTemplates = getTemplates(locale);
  const description = `${t("templates.subA")}${t("templates.subFree")}${t("templates.subB", { count: TEMPLATE_SEO_DATA.length })}`;
  usePageMeta({
    title: t("templates.docTitle"),
    description,
    path: "/templates",
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // 画面のカードと ItemList は同じ並び・同じ条件（template が引けないものは出さない）で作る
  const categories = TEMPLATE_CATEGORIES.flatMap(cat => {
    const templates = (byCategory.get(cat.id) ?? []).flatMap(tpl => {
      const template = localizedTemplates[tpl.templateIndex];
      return template ? [{ tpl, template }] : [];
    });
    if (templates.length === 0) return [];
    const catEn = locale === "en" ? TEMPLATE_CATEGORIES_EN[cat.id] : undefined;
    return [
      {
        cat,
        label: catEn?.label ?? cat.label,
        description: catEn?.description ?? cat.description,
        templates,
      },
    ];
  });
  const listedTemplates = categories.flatMap(c =>
    c.templates.map(({ tpl, template }) => ({
      slug: tpl.slug,
      name: template.name,
    }))
  );

  return (
    <main className="lp lp-surface min-h-screen">
      {/* ── 黒板の見出し帯 ── */}
      <header
        className="relative px-4 pt-8 pb-12 sm:pt-10 sm:pb-14"
        style={{ backgroundColor: C.heroBg }}
      >
        <div className="max-w-4xl mx-auto">
          <nav aria-label={t("templates.breadcrumbAria")}>
            <ol
              className="flex flex-wrap items-center gap-1 text-xs"
              style={{ color: C.heroSubtext }}
            >
              <li>
                <Link
                  href="/about"
                  className="underline underline-offset-4"
                  style={{ color: C.heroText }}
                >
                  {t("footer.about")}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>{t("templates.breadcrumb")}</li>
            </ol>
          </nav>
          <h1
            className="mt-6 text-3xl sm:text-4xl leading-tight"
            style={{ color: C.heroText }}
          >
            {t("templates.heading")}
          </h1>
          <p
            className="mt-4 max-w-2xl text-sm sm:text-base leading-relaxed"
            style={{ color: C.heroSubtext }}
          >
            {t("templates.subA")}
            <strong style={{ color: C.heroText }}>
              {t("templates.subFree")}
            </strong>
            {t("templates.subB", { count: TEMPLATE_SEO_DATA.length })}
          </p>
          <ul className="mt-6 -mx-4 px-4 flex gap-2 overflow-x-auto pb-1 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible">
            {categories.map(({ cat, label }) => (
              <li key={cat.id}>
                <a
                  href={`#${cat.id}`}
                  className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition-colors"
                  style={{
                    backgroundColor: alpha(C.heroText, 12),
                    color: C.heroText,
                  }}
                >
                  <span aria-hidden="true">{cat.emoji}</span>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <ChalkEdge />
      </header>

      {/* ── カテゴリ別テンプレート ── */}
      <div className="px-4 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto flex flex-col gap-14">
          {categories.map(({ cat, label, description, templates }, ci) => {
            const tone = MEMBER_PRESETS[ci % MEMBER_PRESETS.length];
            return (
              <section key={cat.id} id={cat.id} className="scroll-mt-6">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    aria-hidden="true"
                    className="size-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: tone.bgColor }}
                  >
                    {cat.emoji}
                  </span>
                  <h2 className="text-xl sm:text-2xl" style={{ color: C.text }}>
                    {label}
                  </h2>
                </div>
                <p className="text-sm mb-5" style={{ color: C.textMuted }}>
                  {description}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map(({ tpl, template }) => (
                    <TemplateCard
                      key={tpl.slug}
                      href={`/templates/${tpl.slug}`}
                      emoji={template.emoji}
                      name={template.name}
                      tasks={template.groups
                        .map(g => g.tasks.join(locale === "en" ? ", " : "、"))
                        .join(" / ")}
                      meta={
                        <>
                          {t(
                            `templateSummary.${template.assignmentMode === "task" ? "task" : "group"}.${template.groups.length === 1 ? "one" : "other"}`,
                            { count: template.groups.length }
                          )}
                          {locale === "en" ? " · " : "・"}
                          {locale === "en"
                            ? t(
                                `templateSummary.member.${template.members.length === 1 ? "one" : "other"}`,
                                { count: template.members.length }
                              )
                            : `${template.members.length}名`}
                        </>
                      }
                      tone={tone}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <LpCtaBand />

      {/* JSON-LD: BreadcrumbList + ItemList（serializeJsonLd が < をエスケープ） */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd([
            breadcrumbSchema([
              {
                name: t("footer.about"),
                item: window.location.origin + "/about",
              },
              { name: t("templates.breadcrumb") },
            ]),
            itemListSchema(
              listedTemplates.map(tpl => ({
                name: tpl.name,
                url: `${window.location.origin}/templates/${tpl.slug}`,
              }))
            ),
          ]),
        }}
      />

      {/* 固定CTAボタン */}
      <LpCtaLink href="/" variant="fixed">
        {t("lp.createSchedule")}
      </LpCtaLink>
    </main>
  );
}
