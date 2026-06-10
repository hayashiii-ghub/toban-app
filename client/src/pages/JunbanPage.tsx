import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { JUNBAN_PAGE_SEO, JUNBAN_PAGE_SEO_EN } from "@shared/seo-templates";
import type { Member, TaskGroup } from "@/rotation/types";
import { RotationDisc } from "@/features/home/RotationDisc";
import { useT, useLocale } from "@/i18n";

// 円盤の実例（show don't tell）。表現可能な構成（担当者数 ≧ 当番数）にする。
const SAMPLE_MEMBERS: Member[] = [
  { id: "s1", name: "たろう", color: "#2E6B4F", bgColor: "#DCFCE7", textColor: "#14532D" },
  { id: "s2", name: "はなこ", color: "#B45309", bgColor: "#FEF3C7", textColor: "#7C2D12" },
  { id: "s3", name: "ゆうき", color: "#1D4ED8", bgColor: "#DBEAFE", textColor: "#1E3A8A" },
];
const SAMPLE_GROUPS: TaskGroup[] = [
  { id: "g1", tasks: ["そうじ"], emoji: "🧹" },
  { id: "g2", tasks: ["はいぜん"], emoji: "🍚" },
  { id: "g3", tasks: ["にっちょく"], emoji: "📋" },
];

export default function JunbanPage() {
  const t = useT();
  const { locale } = useLocale();
  const seo = locale === "en" ? JUNBAN_PAGE_SEO_EN : JUNBAN_PAGE_SEO;

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = seo.title;
    return () => {
      document.title = t("lp.docTitle");
    };
  }, [seo.title, t]);

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#FFF8E7" }}>
      {/* パンくず */}
      <nav className="px-4 pt-6 pb-2 max-w-3xl mx-auto" aria-label={t("templates.breadcrumbAria")}>
        <ol className="flex flex-wrap items-center gap-1 text-xs text-gray-500">
          <li><Link href="/about" className="hover:underline text-amber-700">{t("footer.about")}</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-gray-700 font-bold">{seo.heading}</li>
        </ol>
      </nav>

      <article className="px-4 pb-8 max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
          {seo.heading}
        </h1>
        <p className="mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
          {seo.intro}
        </p>

        <ul className="mt-6 flex flex-col gap-2">
          {seo.benefits.map((b) => (
            <li key={b} className="text-sm sm:text-base text-gray-700 flex items-start gap-2">
              <span className="text-amber-500 mt-0.5" aria-hidden="true">●</span>
              {b}
            </li>
          ))}
        </ul>
      </article>

      {/* 円盤の実例 */}
      <section className="px-4 pb-10 max-w-2xl mx-auto">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
          <RotationDisc
            groups={SAMPLE_GROUPS}
            members={SAMPLE_MEMBERS}
            rotation={0}
            assignmentMode="member"
          />
        </div>
      </section>

      {/* CTA: 円盤ビューへ直接着地 */}
      <div className="px-4 pb-10 max-w-3xl mx-auto text-center">
        <a
          href="/?view=disc"
          className="inline-flex items-center gap-2 rounded-xl bg-[#2E6B4F] hover:bg-[#245A41] text-white font-bold px-6 py-3 shadow-lg transition-colors"
        >
          {locale === "en" ? "Decide order with the wheel" : "円盤ビューで順番を決める"}
          <ArrowRight className="size-4" />
        </a>
      </div>

      {/* FAQ */}
      <section className="px-4 pb-10 max-w-3xl mx-auto">
        <h2 className="text-lg font-extrabold text-gray-900 mb-4">{t("lp.faqHeading")}</h2>
        <dl className="flex flex-col gap-4">
          {seo.faq.map((f) => (
            <div key={f.question} className="rounded-xl border border-gray-200 bg-white p-4">
              <dt className="text-sm font-bold text-gray-800 mb-1">{f.question}</dt>
              <dd className="text-sm text-gray-600 leading-relaxed">{f.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="px-4 pb-24 max-w-3xl mx-auto text-center">
        <Link href="/templates" className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 hover:underline">
          <ArrowLeft className="size-4" />
          {t("templates.breadcrumb")}
        </Link>
      </div>

      {/* JSON-LD: FAQPage + BreadcrumbList（`<` をエスケープして injection 防御） */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: seo.faq.map((f) => ({
                "@type": "Question",
                name: f.question,
                acceptedAnswer: { "@type": "Answer", text: f.answer },
              })),
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "toban について", item: window.location.origin + "/about" },
                { "@type": "ListItem", position: 2, name: seo.heading },
              ],
            },
          ]).replace(/</g, "\\u003c"),
        }}
      />
    </main>
  );
}
