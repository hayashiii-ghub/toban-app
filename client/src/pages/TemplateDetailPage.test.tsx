import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Route } from "wouter";
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
