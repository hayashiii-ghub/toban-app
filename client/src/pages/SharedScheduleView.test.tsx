import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { Route, Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { STORAGE_KEY } from "@/rotation/constants";
import type { AppState } from "@/rotation/types";
import SharedScheduleView from "./SharedScheduleView";

// 共有相手だけが見る画面なので、作者が壊れに気づけない。
// API は fetch の手前だけ差し替え、api.ts の検証・割り当て計算・描画は本物を通す。
const shared = {
  slug: "AbCdEfGhIj",
  name: "3年2組 掃除当番",
  rotation: 1,
  groups: [
    { id: "g1", tasks: ["黒板"], emoji: "🧽" },
    { id: "g2", tasks: ["床はき"], emoji: "🧹", memberIds: ["m2"] },
  ],
  members: [
    {
      id: "m1",
      name: "あおい",
      color: "#3B82F6",
      bgColor: "#DBEAFE",
      textColor: "#1E3A5F",
    },
    {
      id: "m2",
      name: "そら",
      color: "#10B981",
      bgColor: "#D1FAE5",
      textColor: "#064E3B",
    },
  ],
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

function stubFetch(response: () => Promise<Response>) {
  const fetchMock = vi.fn<typeof fetch>(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderAt(path: string) {
  const location = memoryLocation({ path, record: true });
  render(
    <Router hook={location.hook}>
      <Route path="/s/:slug" component={SharedScheduleView} />
    </Router>
  );
  return location;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("SharedScheduleView", () => {
  it("共有された当番表を表示する", async () => {
    const fetchMock = stubFetch(async () => Response.json(shared));
    renderAt("/s/AbCdEfGhIj");

    expect(
      await screen.findByRole("heading", { name: "3年2組 掃除当番" })
    ).toBeVisible();
    expect(fetchMock.mock.calls[0][0]).toBe("/api/schedules/AbCdEfGhIj");
    // 手動の「1回目」は受け取った人に意味が伝わらないので、画面には出さない
    expect(screen.queryByText("1回目")).toBeNull();
    const cards = screen.getByRole("list", { name: "当番割り当て一覧" });
    expect(within(cards).getAllByRole("listitem")).toHaveLength(2);
    // 床はきはそら専用のグループなので、何回目でもそらが担当する
    expect(within(cards).getByText("床はき")).toBeInTheDocument();
    expect(within(cards).getByText("黒板")).toBeInTheDocument();
    expect(within(cards).getAllByText("そら").length).toBeGreaterThan(0);
  });

  it("日付で交代する当番表は、いつの当番かを日付で伝える", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 8, 30, 9));
    stubFetch(async () =>
      Response.json({
        ...shared,
        rotationConfig: { mode: "date", startDate: "2026-09-28", cycleDays: 7 },
      })
    );
    renderAt("/s/AbCdEfGhIj");
    expect(await screen.findByText("9/28(月)〜10/4(日)の当番")).toBeVisible();
    vi.useRealTimers();
  });

  it.each([
    [404, "スケジュールが見つかりませんでした"],
    [500, "サーバーエラーが発生しました。しばらくしてからお試しください"],
    [400, "データの取得に失敗しました"],
  ])("API が %i を返したら理由を伝える", async (status, message) => {
    stubFetch(async () => Response.json({ error: "x" }, { status }));
    renderAt("/s/AbCdEfGhIj");
    expect(await screen.findByRole("heading", { name: message })).toBeVisible();
  });

  it("通信できないときはネットワークエラーを伝える", async () => {
    stubFetch(async () => {
      throw new TypeError("Failed to fetch");
    });
    renderAt("/s/AbCdEfGhIj");
    expect(
      await screen.findByRole("heading", {
        name: "ネットワークエラーが発生しました。接続を確認してください",
      })
    ).toBeVisible();
  });

  it("自分用にコピーすると新しい ID で保存し、担当者の割り当ても付け替えてホームへ移る", async () => {
    stubFetch(async () => Response.json(shared));
    const location = renderAt("/s/AbCdEfGhIj");

    fireEvent.click(
      await screen.findByRole("button", { name: /この当番表を自分用にコピー/ })
    );

    const state = JSON.parse(localStorage.getItem(STORAGE_KEY)!) as AppState;
    const copy = state.schedules.find(s => s.name === "3年2組 掃除当番")!;
    expect(state.activeScheduleId).toBe(copy.id);
    expect(copy.members.map(m => m.id)).not.toContain("m2");
    const sora = copy.members.find(m => m.name === "そら")!;
    expect(copy.groups[1].memberIds).toEqual([sora.id]);
    expect(location.history?.at(-1)).toBe("/");
  });
});
