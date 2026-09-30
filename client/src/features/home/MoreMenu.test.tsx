import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { LanguageProvider } from "@/i18n";
import { MoreMenu } from "./MoreMenu";

function renderMenu() {
  render(
    <LanguageProvider>
      <MoreMenu />
    </LanguageProvider>
  );
  return screen.getByRole("button", { name: "その他のメニュー" });
}

beforeEach(() => {
  localStorage.setItem("toban-lang", "ja");
});

afterEach(cleanup);

describe("MoreMenu", () => {
  it("ページの一番下の案内と同じ 4 つを出す", () => {
    fireEvent.click(renderMenu());
    const menu = screen.getByRole("menu", { name: "その他のメニュー" });
    const items = within(menu).getAllByRole("menuitem");
    expect(items.map(item => item.textContent)).toEqual([
      "English",
      "toban について",
      "プライバシー",
      "はやしごと",
    ]);
    expect(items[1]).toHaveAttribute("href", "/about");
    expect(items[1]).toHaveAttribute("target", "_blank");
    expect(items[2]).toHaveAttribute("href", "/privacy");
    expect(items[3]).toHaveAttribute("href", "https://shigoto.dev/works/toban");
    expect(items[0]).toHaveFocus();
  });

  it("言語を切り替えると閉じる", () => {
    fireEvent.click(renderMenu());
    fireEvent.click(screen.getByRole("menuitem", { name: "English" }));
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.documentElement.lang).toBe("en");
    expect(screen.getByRole("button", { name: "More" })).toBeInTheDocument();
  });

  it("開いているときにボタンを押すと閉じる（閉じてすぐ開き直さない）", () => {
    const button = renderMenu();
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    fireEvent.pointerDown(button);
    fireEvent.click(button);
    expect(screen.queryByRole("menu")).toBeNull();
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("Esc で閉じるとボタンに戻る", () => {
    const button = renderMenu();
    fireEvent.click(button);
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
    expect(button).toHaveFocus();
  });
});
