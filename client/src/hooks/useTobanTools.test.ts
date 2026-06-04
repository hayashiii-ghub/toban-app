import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { buildTobanTools, useTobanTools } from "./useTobanTools";
import type { useHomeState } from "@/pages/useHomeState";
import type { Assignment, Member, Schedule, TaskGroup } from "@/rotation/types";

type HomeState = ReturnType<typeof useHomeState>;

const member = (id: string, name: string): Member => ({
  id,
  name,
  color: "#3B82F6",
  bgColor: "#DBEAFE",
  textColor: "#1E3A5F",
});

const group = (id: string, emoji: string, tasks: string[]): TaskGroup => ({ id, emoji, tasks });

const sched = (over: Partial<Schedule> = {}): Schedule => ({
  id: "s1",
  name: "掃除当番",
  rotation: 0,
  groups: [group("g1", "🧹", ["床そうじ"])],
  members: [member("m1", "佐藤")],
  ...over,
});

function makeGet(over: Partial<HomeState> = {}): () => HomeState {
  const schedules = over.state?.schedules ?? [sched()];
  const active = "activeSchedule" in over ? over.activeSchedule : schedules[0];
  const base = {
    state: { schedules, activeScheduleId: active?.id ?? "" },
    activeSchedule: active,
    assignments: [] as Assignment[],
    effectiveRotation: 0,
    groups: active?.groups ?? [],
    members: active?.members ?? [],
    ...over,
  } as unknown as HomeState;
  return () => base;
}

const toolNamed = (name: string, get: () => HomeState): WebMCPTool => {
  const found = buildTobanTools(get).find((t) => t.name === name);
  if (!found) throw new Error(`tool not found: ${name}`);
  return found;
};

describe("list_schedules", () => {
  it("全当番表の名前・メンバー数・グループ数を返し、表示中を明示する", async () => {
    const a = sched({ id: "s1", name: "掃除当番", members: [member("m1", "佐藤")] });
    const b = sched({
      id: "s2",
      name: "給食当番",
      members: [member("m1", "佐藤"), member("m2", "鈴木"), member("m3", "高橋")],
      groups: [group("g1", "🍚", ["配膳"]), group("g2", "🧽", ["片付け"])],
    });
    const get = makeGet({ state: { schedules: [a, b], activeScheduleId: "s2" }, activeSchedule: b });

    const text = (await toolNamed("list_schedules", get).execute({})).content[0].text;

    expect(text).toContain("掃除当番");
    expect(text).toContain("給食当番（表示中）");
    expect(text).toContain("メンバー3人");
    expect(text).toContain("グループ2組");
  });

  it("read-only であることを annotations で宣言する", () => {
    expect(toolNamed("list_schedules", makeGet()).annotations?.readOnlyHint).toBe(true);
  });
});

describe("get_current_assignments", () => {
  it("グループと担当メンバーの対応と回転ラベルを返す", async () => {
    const a = sched({
      name: "掃除当番",
      groups: [group("g1", "🧹", ["床そうじ"]), group("g2", "🚮", ["ゴミ出し"])],
      members: [member("m1", "佐藤"), member("m2", "鈴木")],
    });
    const assignments: Assignment[] = [
      { group: a.groups[0], member: a.members[0] },
      { group: a.groups[1], member: a.members[1] },
    ];
    const get = makeGet({
      state: { schedules: [a], activeScheduleId: a.id },
      activeSchedule: a,
      assignments,
      effectiveRotation: 2,
    });

    const text = (await toolNamed("get_current_assignments", get).execute({})).content[0].text;

    expect(text).toContain("掃除当番");
    expect(text).toContain("2回目");
    expect(text).toContain("床そうじ → 佐藤");
    expect(text).toContain("ゴミ出し → 鈴木");
  });

  it("回転 0 は初期と表示する", async () => {
    const a = sched();
    const get = makeGet({
      state: { schedules: [a], activeScheduleId: a.id },
      activeSchedule: a,
      assignments: [{ group: a.groups[0], member: a.members[0] }],
      effectiveRotation: 0,
    });
    const text = (await toolNamed("get_current_assignments", get).execute({})).content[0].text;
    expect(text).toContain("初期");
  });

  it("当番表が無いときはその旨を返す", async () => {
    const get = makeGet({ state: { schedules: [], activeScheduleId: "" }, activeSchedule: undefined });
    const text = (await toolNamed("get_current_assignments", get).execute({})).content[0].text;
    expect(text).toContain("ありません");
  });
});

describe("get_schedule_details", () => {
  it("メンバー・グループ・回転モードを返す", async () => {
    const a = sched({
      name: "掃除当番",
      members: [member("m1", "佐藤"), member("m2", "鈴木")],
      groups: [group("g1", "🧹", ["床", "窓"])],
      rotationConfig: { mode: "date", startDate: "2026-01-01", cycleDays: 7 },
    });
    const get = makeGet({ state: { schedules: [a], activeScheduleId: a.id }, activeSchedule: a });

    const text = (await toolNamed("get_schedule_details", get).execute({})).content[0].text;

    expect(text).toContain("佐藤");
    expect(text).toContain("鈴木");
    expect(text).toContain("床");
    expect(text).toContain("窓");
    expect(text).toContain("日付");
  });

  it("manual モードは手動と表示する", async () => {
    const a = sched({ rotationConfig: { mode: "manual" } });
    const get = makeGet({ state: { schedules: [a], activeScheduleId: a.id }, activeSchedule: a });
    const text = (await toolNamed("get_schedule_details", get).execute({})).content[0].text;
    expect(text).toContain("手動");
  });
});

describe("switch_schedule", () => {
  it("名前が一致する当番表に切り替える", async () => {
    const a = sched({ id: "s1", name: "掃除当番" });
    const b = sched({ id: "s2", name: "給食当番" });
    let switched: string | null = null;
    const get = makeGet({
      state: { schedules: [a, b], activeScheduleId: "s1" },
      activeSchedule: a,
      selectSchedule: (id: string) => {
        switched = id;
      },
    });

    const text = (await toolNamed("switch_schedule", get).execute({ name: "給食当番" })).content[0].text;

    expect(switched).toBe("s2");
    expect(text).toContain("給食当番");
  });

  it("一致しない名前は切り替えず候補を添えて返す", async () => {
    const a = sched({ id: "s1", name: "掃除当番" });
    let switched: string | null = null;
    const get = makeGet({
      state: { schedules: [a], activeScheduleId: "s1" },
      activeSchedule: a,
      selectSchedule: (id: string) => {
        switched = id;
      },
    });

    const text = (await toolNamed("switch_schedule", get).execute({ name: "存在しない表" })).content[0].text;

    expect(switched).toBeNull();
    expect(text).toContain("掃除当番");
  });
});

describe("advance_rotation", () => {
  it("manual モードでは指定方向に回転する", async () => {
    const a = sched({ rotationConfig: { mode: "manual" } });
    let dir: string | null = null;
    const get = makeGet({
      state: { schedules: [a], activeScheduleId: a.id },
      activeSchedule: a,
      handleRotate: (d: "forward" | "backward") => {
        dir = d;
      },
    });

    const text = (await toolNamed("advance_rotation", get).execute({ direction: "forward" })).content[0].text;

    expect(dir).toBe("forward");
    expect(text).toContain("進め");
  });

  it("date モードでは回転せず日付管理であることを伝える", async () => {
    const a = sched({ rotationConfig: { mode: "date", startDate: "2026-01-01", cycleDays: 7 } });
    let dir: string | null = null;
    const get = makeGet({
      state: { schedules: [a], activeScheduleId: a.id },
      activeSchedule: a,
      handleRotate: (d: "forward" | "backward") => {
        dir = d;
      },
    });

    const text = (await toolNamed("advance_rotation", get).execute({ direction: "forward" })).content[0].text;

    expect(dir).toBeNull();
    expect(text).toContain("日付");
  });

  it("不正な direction はエラーを返す", async () => {
    const a = sched({ rotationConfig: { mode: "manual" } });
    let dir: string | null = null;
    const get = makeGet({
      state: { schedules: [a], activeScheduleId: a.id },
      activeSchedule: a,
      handleRotate: (d: "forward" | "backward") => {
        dir = d;
      },
    });

    const text = (await toolNamed("advance_rotation", get).execute({ direction: "sideways" })).content[0].text;

    expect(dir).toBeNull();
    expect(text).toMatch(/forward|backward/);
  });
});

describe("change_view", () => {
  it("有効なビューに切り替える", async () => {
    let view: string | null = null;
    const get = makeGet({
      changeTab: (t: "cards" | "table" | "calendar") => {
        view = t;
      },
    });

    const text = (await toolNamed("change_view", get).execute({ view: "calendar" })).content[0].text;

    expect(view).toBe("calendar");
    expect(text).toContain("カレンダー");
  });

  it("無効なビューは切り替えずエラーを返す", async () => {
    let view: string | null = null;
    const get = makeGet({
      changeTab: (t: "cards" | "table" | "calendar") => {
        view = t;
      },
    });

    const text = (await toolNamed("change_view", get).execute({ view: "timeline" })).content[0].text;

    expect(view).toBeNull();
    expect(text).toMatch(/cards|table|calendar/);
  });
});

describe("create_schedule", () => {
  it("テンプレート名から新しい当番表を作る", async () => {
    let created: { name: string } | null = null;
    const get = makeGet({
      onAddSchedule: (t: { name: string }) => {
        created = t;
      },
    });

    const text = (await toolNamed("create_schedule", get).execute({ template: "給食当番" })).content[0].text;

    expect(created?.name).toBe("給食当番");
    expect(text).toContain("給食当番");
  });

  it("未知のテンプレートは作らず候補を添えて返す", async () => {
    let created: { name: string } | null = null;
    const get = makeGet({
      onAddSchedule: (t: { name: string }) => {
        created = t;
      },
    });

    const text = (await toolNamed("create_schedule", get).execute({ template: "絶対に存在しない名前" })).content[0].text;

    expect(created).toBeNull();
    expect(text).toContain("給食当番");
  });
});

describe("useTobanTools (登録フック)", () => {
  it("registerTool が throw してもフックはクラッシュしない", () => {
    const nav = navigator as unknown as { modelContext?: unknown };
    const original = nav.modelContext;
    nav.modelContext = {
      registerTool: () => {
        throw new Error("boom");
      },
    };
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      expect(() => renderHook(() => useTobanTools(makeGet()()))).not.toThrow();
    } finally {
      warn.mockRestore();
      nav.modelContext = original;
    }
  });
});
