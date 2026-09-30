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
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: "PTA行事準備当番" })
    );
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
