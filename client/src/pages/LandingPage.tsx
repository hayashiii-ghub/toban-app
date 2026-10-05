import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, ChevronDown, Send, Loader2 } from "lucide-react";
import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_SEO_DATA,
  COMMON_FAQ,
  COMMON_FAQ_EN,
} from "@shared/seo-templates";
import { faqPageSchema, serializeJsonLd } from "@shared/jsonLd";
import { CONTACT_CATEGORIES } from "@shared/schemas";
import { LIMITS } from "@shared/limits";
import { getTemplates } from "@shared/template-localization";
import { LP_COLORS as C, alpha } from "@/features/landing/theme";
import { HeroRosterMock } from "@/features/landing/HeroRosterMock";
import { ChalkEdge, TemplateCard } from "@/features/landing/parts";
import { LpStickyCta } from "@/features/landing/LpStickyCta";
import { MEMBER_PRESETS } from "@shared/appearance";
import { useT, useLocale, type MessageKey } from "@/i18n";
import "./landing.css";

const CONTACT_CATEGORY_LABEL_KEYS: Record<
  (typeof CONTACT_CATEGORIES)[number],
  MessageKey
> = {
  不具合の報告: "contact.category.bug",
  機能のご要望: "contact.category.feature",
  使い方の質問: "contact.category.howTo",
  その他: "contact.category.other",
};

function ContactForm() {
  const t = useT();
  const [category, setCategory] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    const honeypot =
      (document.getElementById("contact-url") as HTMLInputElement | null)
        ?.value ?? "";
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, email, message, url: honeypot }),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
      setCategory("");
      setEmail("");
      setMessage("");
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div
        className="border p-6 sm:p-8 text-center"
        style={{
          borderColor: C.border,
          backgroundColor: C.cardBg,
          borderRadius: "6px",
        }}
      >
        <p className="text-lg font-bold" style={{ color: C.primary }}>
          {t("contact.sent")}
        </p>
        <p className="text-sm mt-2" style={{ color: C.textSecondary }}>
          {t("contact.sentDetail")}
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 text-sm font-bold underline"
          style={{ color: C.primary }}
        >
          {t("contact.sendAnother")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* ハニーポット: CSS で非表示。bot が自動入力すると送信をスキップ */}
      <div
        aria-hidden="true"
        className="absolute opacity-0 h-0 overflow-hidden pointer-events-none"
        tabIndex={-1}
      >
        <label htmlFor="contact-url">URL</label>
        <input
          id="contact-url"
          name="url"
          type="text"
          autoComplete="off"
          tabIndex={-1}
          aria-label="URL (honeypot)"
        />
      </div>
      <div>
        <label
          htmlFor="contact-category"
          className="block text-sm font-bold mb-1"
          style={{ color: C.text }}
        >
          {t("contact.categoryLabel")}
        </label>
        <select
          id="contact-category"
          required
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-shadow"
          style={{
            borderColor: C.border,
            backgroundColor: C.cardBg,
            color: category ? C.text : C.textSecondary,
          }}
          aria-label={t("contact.categoryLabel")}
        >
          <option value="" disabled>
            {t("contact.selectPlaceholder")}
          </option>
          {CONTACT_CATEGORIES.map(c => (
            <option key={c} value={c} style={{ color: C.text }}>
              {t(CONTACT_CATEGORY_LABEL_KEYS[c])}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor="contact-email"
          className="block text-sm font-bold mb-1"
          style={{ color: C.text }}
        >
          {t("contact.emailLabel")}
        </label>
        <input
          id="contact-email"
          type="email"
          required
          maxLength={LIMITS.contactEmail}
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-shadow"
          style={{ borderColor: C.border, color: C.text }}
          placeholder="example@email.com"
          aria-label={t("contact.emailLabel")}
        />
      </div>
      <div>
        <label
          htmlFor="contact-message"
          className="block text-sm font-bold mb-1"
          style={{ color: C.text }}
        >
          {t("contact.messageLabel")}
        </label>
        <textarea
          id="contact-message"
          required
          maxLength={LIMITS.contactMessage}
          rows={5}
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-shadow resize-y"
          style={{ borderColor: C.border, color: C.text }}
          placeholder={t("contact.messagePlaceholder")}
          aria-label={t("contact.messageLabel")}
        />
      </div>
      {status === "error" && (
        <p className="text-sm text-red-600">{t("contact.error")}</p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex items-center justify-center gap-2 rounded-xl font-bold px-6 py-3 transition-colors disabled:opacity-60"
        style={{ backgroundColor: C.primary, color: C.heroText }}
      >
        {status === "sending" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
        {status === "sending" ? t("contact.sending") : t("contact.submit")}
      </button>
    </form>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${C.line}` }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 py-4 text-left"
      >
        <span
          aria-hidden="true"
          className="size-7 flex-shrink-0 rounded-full flex items-center justify-center text-xs"
          style={{ backgroundColor: C.primary, color: C.heroText }}
        >
          Q
        </span>
        <span className="flex-1 text-sm sm:text-base" style={{ color: C.text }}>
          {question}
        </span>
        <ChevronDown
          className="size-4 flex-shrink-0 transition-transform"
          style={{
            color: C.textMuted,
            transform: open ? "rotate(180deg)" : undefined,
          }}
        />
      </button>
      {open && (
        <p
          className="pl-10 pr-6 pb-5 -mt-1 text-sm leading-relaxed"
          style={{ color: C.textSecondary }}
        >
          {answer}
        </p>
      )}
    </div>
  );
}

const FEATURES: { emoji: string; label: MessageKey; desc: MessageKey }[] = [
  {
    emoji: "📝",
    label: "lp.feat.noSignup.label",
    desc: "lp.feat.noSignup.desc",
  },
  { emoji: "🖨️", label: "lp.feat.print.label", desc: "lp.feat.print.desc" },
  { emoji: "🔗", label: "lp.feat.share.label", desc: "lp.feat.share.desc" },
  { emoji: "🆓", label: "lp.feat.free.label", desc: "lp.feat.free.desc" },
];
// MEMBER_PRESETS の添字（青・緑・オレンジ・紫）。アプリのメンバー色と同じ色味にそろえる
const FEATURE_COLORS = [4, 3, 1, 5];

// 作り方の 1 枚。紙を貼ったように少し傾ける
function WayPanel({
  emoji,
  label,
  tilt,
  children,
}: {
  emoji: string;
  label: string;
  tilt: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative flex flex-col p-6 sm:p-7"
      style={{
        backgroundColor: C.cardBg,
        borderRadius: "10px",
        boxShadow:
          "0 10px 30px rgba(41, 74, 58, 0.12), 0 1px 3px rgba(41, 74, 58, 0.1)",
        transform: `rotate(${tilt * 0.6}deg)`,
      }}
    >
      <span
        aria-hidden="true"
        className="absolute -top-3 left-1/2 h-6 w-20"
        style={{
          backgroundColor: alpha(C.highlight, 70),
          transform: `translateX(-50%) rotate(${-tilt * 3}deg)`,
        }}
      />
      <div className="flex items-center gap-3 mb-3">
        <span aria-hidden="true" className="text-3xl">
          {emoji}
        </span>
        <span className="text-lg sm:text-xl" style={{ color: C.text }}>
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

// カテゴリから代表テンプレートを抜粋（各カテゴリ1つずつ、最大6つ）
const featuredTemplates = TEMPLATE_CATEGORIES.flatMap(cat => {
  const t = TEMPLATE_SEO_DATA.find(t => t.categoryId === cat.id);
  return t ? [t] : [];
}).slice(0, 6);

export default function LandingPage() {
  const t = useT();
  const { locale } = useLocale();
  const faqs = locale === "en" ? COMMON_FAQ_EN : COMMON_FAQ;

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = t("lp.docTitle");
  }, [t]);

  return (
    <main
      className="lp lp-surface min-h-screen"
      style={{ fontFamily: "'Kiwi Maru', serif" }}
    >
      {/* ── ヒーロー（黒板に貼った当番表） ── */}
      <section
        className="relative overflow-hidden px-4 pt-14 pb-20 sm:pt-20 sm:pb-24"
        style={{ backgroundColor: C.heroBg }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 15% 20%, rgba(255,255,255,0.07), transparent 45%), radial-gradient(ellipse at 85% 80%, rgba(255,255,255,0.05), transparent 50%)",
          }}
        />
        <ChalkEdge />
        <div className="relative max-w-5xl mx-auto grid md:grid-cols-[1.1fr_1fr] gap-12 md:gap-8 items-center">
          <div className="text-center md:text-left">
            <h1
              className="text-[2.75rem] sm:text-5xl lg:text-6xl leading-tight max-sm:[&:lang(en)]:text-4xl lg:[&:lang(en)]:text-5xl"
              style={{ color: C.heroText }}
            >
              {t("lp.heroTitleA")}
              <br />
              <span className="relative inline-block sm:whitespace-nowrap">
                {t("lp.heroTitleB")}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                  className="absolute left-0 -bottom-2 w-full h-3"
                >
                  <path
                    d="M3 8 C 50 2, 110 11, 197 4"
                    fill="none"
                    stroke="var(--lp-highlight)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
            <p
              className="mt-6 text-base sm:text-lg leading-relaxed"
              style={{ color: C.heroSubtext }}
            >
              {t("lp.heroSubA")}
              <br />
              {t("lp.heroSubB")}
            </p>
          </div>
          <HeroRosterMock />
        </div>
      </section>

      {/* ── 特徴 ── */}
      <section className="px-4 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-2xl sm:text-3xl text-center mb-12"
            style={{ color: C.text }}
          >
            {t("lp.featuresHeading")}
          </h2>
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
            {FEATURES.map(({ emoji, label, desc }, i) => (
              <li key={label} className="text-center">
                <div
                  aria-hidden="true"
                  className="mx-auto mb-4 size-16 rounded-2xl flex items-center justify-center text-3xl"
                  style={{
                    backgroundColor: MEMBER_PRESETS[FEATURE_COLORS[i]].bgColor,
                    transform: `rotate(${i % 2 === 0 ? -4 : 4}deg)`,
                  }}
                >
                  {emoji}
                </div>
                <div className="text-base sm:text-lg" style={{ color: C.text }}>
                  {t(label)}
                </div>
                <p
                  className="mt-2 text-xs sm:text-sm leading-relaxed max-w-[15rem] mx-auto"
                  style={{ color: C.textSecondary }}
                >
                  {t(desc)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 作り方（テンプレート / AI） ── */}
      <section
        className="px-4 py-16 sm:py-20"
        style={{ backgroundColor: alpha(C.primary, 5) }}
      >
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-2xl sm:text-3xl text-center mb-12"
            style={{ color: C.text }}
          >
            {t("lp.ways.heading")}
          </h2>
          <div className="grid md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-4 items-stretch">
            <WayPanel emoji="📋" label={t("lp.ways.template.label")} tilt={-1}>
              <p
                className="text-sm leading-relaxed"
                style={{ color: C.textSecondary }}
              >
                {t("lp.ways.template.desc")}
              </p>
              <ul aria-hidden="true" className="mt-5 flex flex-col gap-2">
                {featuredTemplates.slice(0, 3).map((tpl, i) => {
                  const template = getTemplates(locale)[tpl.templateIndex];
                  if (!template) return null;
                  return (
                    <li
                      key={tpl.slug}
                      className="flex items-center gap-2 px-3 py-2 text-sm"
                      style={{
                        backgroundColor: "#ffffff",
                        border: `1px solid ${C.line}`,
                        borderRadius: "8px",
                        color: C.text,
                        marginLeft: `${i * 12}px`,
                      }}
                    >
                      <span>{template.emoji}</span>
                      {template.name}
                    </li>
                  );
                })}
              </ul>
              <a
                href="#templates"
                className="mt-auto pt-5 inline-flex items-center gap-1 text-sm underline underline-offset-4"
                style={{ color: C.primary }}
              >
                {t("lp.ways.template.link")}
                <ChevronDown className="size-4" />
              </a>
            </WayPanel>
            <div
              aria-hidden="true"
              className="flex md:flex-col items-center justify-center gap-3"
            >
              <span
                className="h-px w-12 md:h-12 md:w-px"
                style={{ backgroundColor: C.line }}
              />
              <span
                className="size-12 rounded-full flex items-center justify-center text-xs"
                style={{ backgroundColor: C.primary, color: C.heroText }}
              >
                {t("lp.ways.or")}
              </span>
              <span
                className="h-px w-12 md:h-12 md:w-px"
                style={{ backgroundColor: C.line }}
              />
            </div>
            <WayPanel emoji="🤖" label={t("lp.ways.ai.label")} tilt={1}>
              <p
                className="text-sm leading-relaxed"
                style={{ color: C.textSecondary }}
              >
                {t("lp.ways.ai.desc")}
              </p>
              <p
                className="lp-pretty mt-5 ml-auto max-w-[92%] px-4 py-3 text-sm leading-relaxed"
                style={{
                  backgroundColor: C.primary,
                  color: C.heroText,
                  borderRadius: "18px 18px 4px 18px",
                }}
              >
                {t("lp.ways.ai.example")}
              </p>
              <p
                className="mt-auto pt-5 text-xs"
                style={{ color: C.textMuted }}
              >
                {t("lp.ways.ai.note")}
              </p>
            </WayPanel>
          </div>
        </div>
      </section>

      {/* ── テンプレート紹介 ── */}
      <section id="templates" className="px-4 py-16 sm:py-20 scroll-mt-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl" style={{ color: C.text }}>
                {t("lp.templatesHeading")}
              </h2>
              <p className="mt-2 text-sm" style={{ color: C.textMuted }}>
                {t("lp.templatesSubtitle", { count: TEMPLATE_SEO_DATA.length })}
              </p>
            </div>
            <Link
              href="/templates"
              className="inline-flex items-center gap-1 text-sm underline underline-offset-4"
              style={{ color: C.primary }}
            >
              {t("lp.viewAllTemplates")}
              <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredTemplates.map((tpl, i) => {
              const template = getTemplates(locale)[tpl.templateIndex];
              if (!template) return null;
              return (
                <TemplateCard
                  key={tpl.slug}
                  href={`/templates/${tpl.slug}`}
                  emoji={template.emoji}
                  name={template.name}
                  tasks={template.groups
                    .map(g => g.tasks.join(locale === "en" ? ", " : "、"))
                    .join(" / ")}
                  tone={MEMBER_PRESETS[i % MEMBER_PRESETS.length]}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Q&A ── */}
      <section
        className="px-4 py-16 sm:py-20"
        style={{ backgroundColor: alpha(C.primary, 5) }}
      >
        <div className="max-w-5xl mx-auto grid md:grid-cols-[16rem_1fr] gap-8 md:gap-12">
          <div className="md:sticky md:top-8 self-start text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl" style={{ color: C.text }}>
              {t("lp.faqHeading")}
            </h2>
            <p
              className="mt-3 text-sm leading-relaxed"
              style={{ color: C.textMuted }}
            >
              {t("lp.faq.lead")}
            </p>
          </div>
          <div style={{ borderTop: `1px solid ${C.line}` }}>
            {faqs.map(faq => (
              <FAQItem
                key={faq.question}
                question={faq.question}
                answer={faq.answer}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── お問い合わせ ── */}
      <section id="contact" className="px-4 py-12 sm:py-16">
        <div className="max-w-xl mx-auto">
          <h2
            className="text-xl sm:text-2xl font-extrabold text-center mb-2"
            style={{ color: C.text }}
          >
            {t("contact.heading")}
          </h2>
          <p
            className="text-sm text-center mb-8"
            style={{ color: C.textMuted }}
          >
            {t("contact.subtitle")}
          </p>
          <div
            className="p-5 sm:p-7"
            style={{
              backgroundColor: C.cardBg,
              borderRadius: "10px",
              boxShadow:
                "0 10px 30px rgba(41, 74, 58, 0.12), 0 1px 3px rgba(41, 74, 58, 0.1)",
            }}
          >
            <ContactForm />
          </div>
        </div>
      </section>

      <footer className="pb-8 sm:pb-24 text-center text-sm">
        <a href="/privacy" style={{ color: C.textMuted }}>
          {t("footer.privacy")}
        </a>
      </footer>

      <LpStickyCta href="/">{t("lp.createSchedule")}</LpStickyCta>

      {/* JSON-LD: 構造化データ（serializeJsonLd が < をエスケープ）。
          WebApplication はここでは出さない。index.html が SPA シェルとして
          全ルートに配っており、そちらは @id と featureList を持つ詳しい版なので、
          ここで出すと同じアプリを2回宣言することになる。 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd([faqPageSchema(COMMON_FAQ)]),
        }}
      />
    </main>
  );
}
