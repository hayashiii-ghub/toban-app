import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { NewScheduleModal } from "./NewScheduleModal";

afterEach(cleanup);

async function renderPicker() {
  const onSelect = vi.fn();
  render(<NewScheduleModal onSelect={onSelect} onClose={vi.fn()} />);
  const dialog = screen.getByRole("dialog");
  // フェードインが終わってから見え方を確かめる
  await waitFor(() => expect(dialog).toBeVisible());
  return { onSelect, dialog };
}

describe("NewScheduleModal", () => {
  it("名前・仕事・カテゴリ名で探せる（全角と半角を区別しない）", async () => {
    const { dialog, onSelect } = await renderPicker();
    const search = within(dialog).getByRole("searchbox", {
      name: "テンプレートを探す",
    });

    fireEvent.change(search, { target: { value: "給食" } });
    expect(
      within(dialog).getByRole("button", { name: /^給食当番/ })
    ).toBeVisible();
    // 探している間は、カテゴリの一覧を出さない
    expect(
      within(dialog).queryByRole("button", { name: /小中学校（クラス用）/ })
    ).toBeNull();

    // 仕事の名前でも見つかる（家事ローテーションの「お風呂掃除」）
    fireEvent.change(search, { target: { value: "お風呂" } });
    expect(
      within(dialog).getByRole("button", { name: /^家事ローテーション/ })
    ).toBeVisible();

    // カテゴリ名（介護施設）でも見つかる
    fireEvent.change(search, { target: { value: "介護" } });
    expect(
      within(dialog).getByRole("button", { name: /^夜勤当番/ })
    ).toBeVisible();

    fireEvent.change(search, { target: { value: "ＰＴＡ" } });
    fireEvent.click(
      within(dialog).getByRole("button", { name: /^PTA行事準備当番/ })
    );
    // 選んだら、すぐには作らず名前を入れる画面に進む
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "この内容で作る" })
    );
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: "PTA行事準備当番" })
    );
  });

  it("名前と交代のしかたを入れて作る。戻ると選び直せる", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 8, 30, 10)); // 9/30(水)
    const { dialog, onSelect } = await renderPicker();
    fireEvent.change(
      within(dialog).getByRole("searchbox", { name: "テンプレートを探す" }),
      { target: { value: "事務室の掃除" } }
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: /^事務室の掃除当番/ })
    );

    const names = within(dialog).getByRole("textbox", {
      name: "メンバーの名前（1行に1人）",
    });
    expect(names).toHaveFocus();
    // 見本は 4 人・仕事 4 つ。6 人にすると 2 人が休む
    fireEvent.change(names, {
      target: { value: "山田\n中村\n小林, 加藤、木村\t吉田" },
    });
    expect(
      within(dialog).getByText(
        "6人で回します。仕事は4つなので、毎回2人がお休みです。"
      )
    ).toBeVisible();
    fireEvent.click(
      within(dialog).getByRole("radio", { name: /毎週月曜に交代/ })
    );
    fireEvent.change(
      within(dialog).getByRole("textbox", { name: "当番表の名前" }),
      {
        target: { value: "2階の掃除" },
      }
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "この内容で作る" })
    );

    const created = onSelect.mock.calls[0][0];
    expect(created.name).toBe("2階の掃除");
    expect(created.members.map((m: { name: string }) => m.name)).toEqual([
      "山田",
      "中村",
      "小林",
      "加藤",
      "木村",
      "吉田",
    ]);
    expect(created.rotationConfig).toEqual({
      mode: "date",
      startDate: "2026-09-28",
      cycleDays: 7,
    });
    vi.useRealTimers();
  });

  it("名前が空なら見本の名前のまま、手で送る形で作る", async () => {
    const { dialog, onSelect } = await renderPicker();
    fireEvent.change(
      within(dialog).getByRole("searchbox", { name: "テンプレートを探す" }),
      { target: { value: "給食" } }
    );
    fireEvent.click(within(dialog).getByRole("button", { name: /^給食当番/ }));
    expect(
      within(dialog).getByText(
        "空のままなら、見本の名前（1班、2班、3班…）で作ります。あとで編集できます。"
      )
    ).toBeVisible();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "テンプレートを選び直す" })
    );
    expect(
      within(dialog).getByRole("searchbox", { name: "テンプレートを探す" })
    ).toHaveValue("給食");
    fireEvent.click(within(dialog).getByRole("button", { name: /^給食当番/ }));
    fireEvent.click(
      within(dialog).getByRole("button", { name: "この内容で作る" })
    );
    const created = onSelect.mock.calls[0][0];
    expect(created.members.map((m: { name: string }) => m.name)).toEqual([
      "1班",
      "2班",
      "3班",
      "4班",
    ]);
    expect(created.rotationConfig).toBeUndefined();
  });

  it("「新しくつくる」はすぐに作る", async () => {
    const { dialog, onSelect } = await renderPicker();
    fireEvent.click(
      within(dialog).getByRole("button", { name: /新しくつくる/ })
    );
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("見つからないときは、そう伝える", async () => {
    const { dialog } = await renderPicker();
    fireEvent.change(
      within(dialog).getByRole("searchbox", { name: "テンプレートを探す" }),
      { target: { value: "宇宙旅行" } }
    );
    expect(
      within(dialog).getByText("「宇宙旅行」に合うテンプレートはありません")
    ).toBeVisible();
  });
});
