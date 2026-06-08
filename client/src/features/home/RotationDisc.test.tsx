import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, within } from "@testing-library/react";
import { RotationDisc } from "./RotationDisc";
import type { Member, TaskGroup } from "@shared/types";

afterEach(cleanup);

const mk = (id: string, name: string, extra: Partial<Member> = {}): Member => ({
  id, name, color: "#4F46E5", bgColor: "#EEF2FF", textColor: "#312E81", ...extra,
});
const grp = (id: string, tasks: string[], emoji = "🧹", extra: Partial<TaskGroup> = {}): TaskGroup => ({
  id, tasks, emoji, ...extra,
});

const members = [mk("m1", "田中"), mk("m2", "鈴木"), mk("m3", "佐藤"), mk("m4", "高橋")];
const groups = [grp("g1", ["掃除"]), grp("g2", ["配膳"]), grp("g3", ["日直"])];

describe("RotationDisc", () => {
  it("表現可能な構成では円盤SVGと全メンバー名を描画する", () => {
    const { container } = render(
      <RotationDisc groups={groups} members={members} rotation={0} assignmentMode="member" />,
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
    const view = within(container);
    expect(view.getByText("田中")).toBeInTheDocument();
    expect(view.getByText("高橋")).toBeInTheDocument();
  });

  it("役割名は盤面ではなく凡例にテキスト表示される（外周はみ出し回避）", () => {
    const { container } = render(
      <RotationDisc groups={groups} members={members} rotation={0} assignmentMode="member" />,
    );
    const view = within(container);
    // 役割タスク文字列は独立ノードとして凡例に出る
    expect(view.getByText("掃除")).toBeInTheDocument();
    expect(view.getByText("配膳")).toBeInTheDocument();
    expect(view.getByText("日直")).toBeInTheDocument();
  });

  it("各扇形に hover/a11y 用の <title>（役割：メンバー）を持つ", () => {
    const { container } = render(
      <RotationDisc groups={groups} members={members} rotation={0} assignmentMode="member" />,
    );
    const titles = Array.from(container.querySelectorAll("title")).map(el => el.textContent);
    // rotation0: 掃除→田中 / 余り(高橋)はおやすみ
    expect(titles).toContain("🧹 掃除：田中");
    expect(titles).toContain("💤 おやすみ：高橋");
  });

  it("役割数 < メンバー数では凡例に「おやすみ」を表示する", () => {
    const { container } = render(
      <RotationDisc groups={groups} members={members} rotation={0} assignmentMode="member" />,
    );
    // groups 3 < members 4 → 1人がおやすみ
    expect(within(container).getByText("おやすみ")).toBeInTheDocument();
  });

  it("グループ専用メンバー(memberIds)があると円盤化できず注記を出しSVGを描かない", () => {
    const pooled = [grp("g1", ["掃除"], "🧹", { memberIds: ["m1", "m2"] }), grp("g2", ["配膳"])];
    const { container } = render(
      <RotationDisc groups={pooled} members={members} rotation={0} assignmentMode="member" />,
    );
    expect(within(container).getByText(/円盤にできません/)).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it("役割数 > メンバー数でも円盤化できず注記を出す", () => {
    const tooManyRoles = [
      grp("g1", ["A"]), grp("g2", ["B"]), grp("g3", ["C"]), grp("g4", ["D"]), grp("g5", ["E"]),
    ];
    const twoMembers = [mk("m1", "田中"), mk("m2", "鈴木")];
    const { container } = render(
      <RotationDisc groups={tooManyRoles} members={twoMembers} rotation={0} assignmentMode="member" />,
    );
    expect(within(container).getByText(/円盤にできません/)).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });
});
