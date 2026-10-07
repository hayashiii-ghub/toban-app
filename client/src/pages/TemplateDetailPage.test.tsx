import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LanguageProvider } from "@/i18n";
import { TEMPLATE_CONTENT } from "@shared/template-content";
import { TEMPLATE_SEO_DATA } from "@shared/seo-templates";
import { renderTemplateDetailHtml } from "../../../server/handlers/seo";
import { readFileSync } from "node:fs";
import { Router, Route } from "wouter";
import TemplateDetailPage from "./TemplateDetailPage";

afterEach(cleanup);

describe("TemplateDetailPage", () => {
  it("未知slugの404画面で、そのURLをcanonicalにしない", () => {
    window.history.pushState({}, "", "/templates/not-a-real-template");
    document.head.innerHTML =
      '<link rel="canonical" href="https://toban.app/">';

    render(<Route path="/templates/:slug" component={TemplateDetailPage} />);

    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute("href")
    ).toBe("https://toban.app/");
  });
});

describe("記事本文の言語とクローラーの一致", () => {
  it("直接アクセス・PWA が使う共通シェルには広告を置かない", () => {
    expect(readFileSync("client/index.html", "utf8")).not.toContain(
      "adsbygoogle"
    );
  });

  it.each(["ja", "en"])(
    "%s でも全記事の本文・FAQ がクローラーと一致する",
    locale => {
      localStorage.setItem("toban-lang", locale);
      for (const seo of TEMPLATE_SEO_DATA) {
        const html = renderToStaticMarkup(
          <Router ssrPath={`/templates/${seo.slug}`}>
            <LanguageProvider>
              <Route path="/templates/:slug" component={TemplateDetailPage} />
            </LanguageProvider>
          </Router>
        );
        const human = new DOMParser().parseFromString(html, "text/html");
        const bot = new DOMParser().parseFromString(
          renderTemplateDetailHtml("https://toban.app", seo.slug)!,
          "text/html"
        );
        const content = TEMPLATE_CONTENT[seo.slug];
        const texts = [
          ...content.body.flatMap(section => [
            section.heading,
            ...section.paragraphs,
          ]),
          ...content.faq.flatMap(item => [item.question, item.answer]),
        ];
        for (const text of texts) {
          expect(human.body.textContent).toContain(text);
          expect(bot.body.textContent).toContain(text);
        }
        expect(human.querySelectorAll('section[lang="ja"]')).toHaveLength(2);
      }
      localStorage.removeItem("toban-lang");
    }
  );
});
