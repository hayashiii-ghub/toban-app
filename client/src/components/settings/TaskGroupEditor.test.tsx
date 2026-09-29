import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { LIMITS } from "@shared/limits";
import type { AssignmentMode, Member, TaskGroup } from "@/rotation/types";
import { TaskGroupEditor } from "./TaskGroupEditor";

afterEach(cleanup);

const member = (id: string, name: string): Member => ({
  id,
  name,
  color: "#3B82F6",
  bgColor: "#DBEAFE",
  textColor: "#1E3A5F",
});

const members = [member("m1", "あおい"), member("m2", "そら")];
const groups: TaskGroup[] = [
  { id: "g1", tasks: ["黒板"], emoji: "🧽" },
  { id: "g2", tasks: ["床はき"], emoji: "🧹" },
];

/** 親（SettingsModal）の代わりに状態を持ち、最新の値を外から読めるようにする */
function renderEditor(
  initial: {
    groups?: TaskGroup[];
    members?: Member[];
    assignmentMode?: AssignmentMode;
  } = {}
) {
  const latest = {
    groups: initial.groups ?? groups,
    members: initial.members ?? members,
  };
  function Harness() {
    const [g, setG] = useState(latest.groups);
    const [m, setM] = useState(latest.members);
    latest.groups = g;
    latest.members = m;
    return (
      <TaskGroupEditor
        groups={g}
        members={m}
        onGroupsChange={setG}
        onMembersChange={setM}
        assignmentMode={initial.assignmentMode}
      />
    );
  }
  render(<Harness />);
  return latest;
}

describe("TaskGroupEditor（担当者から見る）", () => {
  it("担当者を追加すると、担当者とグループが対で増える", () => {
    const state = renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "担当者を追加" }));
    expect(state.members).toHaveLength(3);
    expect(state.groups).toHaveLength(3);
  });

  it("グループを消すと対の担当者も消え、最後の1つは消せない", () => {
    const state = renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "グループ1を削除" }));
    expect(state.groups.map(g => g.id)).toEqual(["g2"]);
    expect(state.members.map(m => m.name)).toEqual(["そら"]);
    expect(
      screen.getByRole("button", { name: "グループ1を削除" })
    ).toBeDisabled();
  });

  it("下に移動すると、グループと担当者の順番が一緒に入れ替わる", () => {
    const state = renderEditor();
    fireEvent.click(
      screen.getAllByRole("button", { name: "グループを下に移動" })[0]
    );
    expect(state.groups.map(g => g.id)).toEqual(["g2", "g1"]);
    expect(state.members.map(m => m.name)).toEqual(["そら", "あおい"]);
  });

  it("担当者の名前を書き換えられる", () => {
    const state = renderEditor();
    fireEvent.change(screen.getByRole("textbox", { name: "担当者2の名前" }), {
      target: { value: "そらまめ" },
    });
    expect(state.members.map(m => m.name)).toEqual(["あおい", "そらまめ"]);
  });

  it("担当者が上限に達していると、担当者もグループも増やさない", () => {
    const full = Array.from({ length: LIMITS.members }, (_, i) =>
      member(`m${i}`, `メンバー${i}`)
    );
    const state = renderEditor({ members: full });
    fireEvent.click(screen.getByRole("button", { name: "担当者を追加" }));
    expect(state.members).toHaveLength(LIMITS.members);
    expect(state.groups).toHaveLength(2);
  });
});

describe("TaskGroupEditor（タスクから見る）", () => {
  it("グループを消しても担当者は残る", () => {
    const state = renderEditor({ assignmentMode: "task" });
    fireEvent.click(screen.getByRole("button", { name: "グループ2を削除" }));
    expect(state.groups.map(g => g.id)).toEqual(["g1"]);
    expect(state.members).toHaveLength(2);
  });

  it("担当者をえらぶ → 1人外す → 全員にもどす で、グループ専用の担当者が切り替わる", () => {
    const state = renderEditor({ assignmentMode: "task" });
    fireEvent.click(
      screen.getAllByRole("button", { name: "担当者をえらぶ" })[0]
    );
    expect(state.groups[0].memberIds).toEqual(["m1", "m2"]);

    fireEvent.click(screen.getByRole("button", { name: "あおいを除外" }));
    expect(state.groups[0].memberIds).toEqual(["m2"]);
    // 担当者が0人のグループは作れない
    expect(screen.getByRole("button", { name: "そらを除外" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "全員にもどす" }));
    expect(state.groups[0].memberIds).toBeUndefined();
  });

  it("仕事の名前を書き換えられる", () => {
    const state = renderEditor({ assignmentMode: "task" });
    fireEvent.change(screen.getByRole("textbox", { name: "タスク1の名前" }), {
      target: { value: "黒板けし" },
    });
    expect(state.groups[0].tasks).toEqual(["黒板けし"]);
  });
});

// jsdom には DataTransfer が無いので、ハンドラが触る分だけの偽物を渡す
function drag(from: Element, to: Element) {
  const dataTransfer = {
    effectAllowed: "",
    dropEffect: "",
    setDragImage: vi.fn(),
  };
  fireEvent.dragStart(from, { dataTransfer });
  fireEvent.dragOver(to, { dataTransfer });
  fireEvent.drop(to, { dataTransfer });
  fireEvent.dragEnd(from, { dataTransfer });
}

const draggableOf = (el: Element) => el.closest('[draggable="true"]')!;

describe("TaskGroupEditor のドラッグ", () => {
  it("仕事を別のグループの行に落とすと、その位置へ移る", () => {
    const state = renderEditor({
      groups: [
        { id: "g1", tasks: ["黒板", "窓"], emoji: "🧽" },
        { id: "g2", tasks: ["床はき"], emoji: "🧹" },
      ],
    });
    drag(
      draggableOf(screen.getByRole("textbox", { name: "グループ1のタスク1" })),
      draggableOf(screen.getByRole("textbox", { name: "グループ2のタスク1" }))
    );
    expect(state.groups.map(g => g.tasks)).toEqual([
      ["窓"],
      ["黒板", "床はき"],
    ]);
  });

  it("グループを並べ替えると、担当者の順番も一緒に動く", () => {
    const state = renderEditor();
    const header = (n: number) =>
      draggableOf(screen.getByRole("textbox", { name: `担当者${n}の名前` }));
    // グループ全体（見出しの親）の上に落とす
    drag(header(1), header(2).parentElement!);
    expect(state.groups.map(g => g.id)).toEqual(["g2", "g1"]);
    expect(state.members.map(m => m.name)).toEqual(["そら", "あおい"]);
  });

  it("タスクモードでは、グループの中で担当者を並べ替えられる", () => {
    const state = renderEditor({
      assignmentMode: "task",
      groups: [
        { id: "g1", tasks: ["黒板"], emoji: "🧽", memberIds: ["m1", "m2"] },
        { id: "g2", tasks: ["床はき"], emoji: "🧹" },
      ],
    });
    const [aoi, sora] = screen
      .getAllByRole("textbox", { name: "メンバーの名前" })
      .map(draggableOf);
    drag(aoi, sora);
    expect(state.groups[0].memberIds).toEqual(["m2", "m1"]);
  });
});
