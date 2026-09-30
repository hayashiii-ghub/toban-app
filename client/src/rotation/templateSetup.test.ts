import { describe, expect, it } from "vitest";
import type { ScheduleTemplate } from "./types";
import {
  applyMemberNames,
  parseNames,
  rotationConfigForPreset,
} from "./templateSetup";
import { computeAssignments, computeDateRotationForDate } from "./utils";
import { parseIsoDateLocal } from "./dateUtils";

const member = (id: string, name: string) => ({
  id,
  name,
  color: "#3B82F6",
  bgColor: "#DBEAFE",
  textColor: "#1E3A5F",
});

// 担当者モード（仕事ごとに全員が順に回る）
const byMember: ScheduleTemplate = {
  name: "事務室の掃除当番",
  emoji: "🏢",
  groups: [
    { id: "g1", tasks: ["床"], emoji: "🧹" },
    { id: "g2", tasks: ["窓"], emoji: "🪟" },
  ],
  members: [member("m1", "佐藤"), member("m2", "鈴木")],
};

// タスクモード（仕事ごとに担当者を絞れる）
const byTask: ScheduleTemplate = {
  name: "フロア担当",
  emoji: "🏥",
  assignmentMode: "task",
  groups: [
    { id: "g1", tasks: ["1階"], emoji: "1️⃣", memberIds: ["m1", "m2", "m3"] },
    { id: "g2", tasks: ["2階"], emoji: "2️⃣", memberIds: ["m2", "m3"] },
    { id: "g3", tasks: ["夜間"], emoji: "🌙" },
  ],
  members: [member("m1", "高橋"), member("m2", "伊藤"), member("m3", "渡辺")],
};

describe("parseNames", () => {
  it("改行・カンマ・読点・タブで区切り、空白と空行を除く", () => {
    expect(parseNames("山田\n 佐藤 ,鈴木、高橋\t田中\n\n")).toEqual([
      "山田",
      "佐藤",
      "鈴木",
      "高橋",
      "田中",
    ]);
    expect(parseNames("   ")).toEqual([]);
  });
});

describe("applyMemberNames", () => {
  it("名前が空ならテンプレートのまま", () => {
    const result = applyMemberNames(byMember, []);
    expect(result.members).toBe(byMember.members);
    expect(result.groups).toBe(byMember.groups);
  });

  it("同じ人数なら、ID と色を保ったまま名前だけ置き換える", () => {
    const { members, groups } = applyMemberNames(byMember, ["山田", "中村"]);
    expect(members.map(m => [m.id, m.name])).toEqual([
      ["m1", "山田"],
      ["m2", "中村"],
    ]);
    expect(members[0].color).toBe(byMember.members[0].color);
    expect(groups).toEqual(byMember.groups);
  });

  it("担当者モードは、人数が変わっても仕事はそのまま（多ければ休む人が出る）", () => {
    const { members, groups } = applyMemberNames(byMember, [
      "山田",
      "中村",
      "小林",
    ]);
    expect(members).toHaveLength(3);
    expect(members[2].id).not.toMatch(/^m[12]$/);
    // 足した人は、見本の人と違う色になる
    expect(members[2].color).not.toBe(members[0].color);
    expect(groups).toEqual(byMember.groups);
    // 仕事は 2 つなので、毎回 1 人が休む
    const assigned = computeAssignments(groups, members, 0).map(
      a => a.member.name
    );
    expect(assigned).toEqual(["山田", "中村"]);
  });

  it("タスクモードは、全員が担当の仕事にだけ足した人を加え、外した人は割り当てから消す", () => {
    const more = applyMemberNames(byTask, ["A", "B", "C", "D"]);
    const d = more.members[3].id;
    expect(more.groups[0].memberIds).toEqual(["m1", "m2", "m3", d]);
    // 一部の人だけの仕事には足さない
    expect(more.groups[1].memberIds).toEqual(["m2", "m3"]);
    expect(more.groups[2].memberIds).toBeUndefined();

    const fewer = applyMemberNames(byTask, ["A"]);
    expect(fewer.groups[0].memberIds).toEqual(["m1"]);
    // 担当が誰もいなくなった仕事は、全員が担当に戻す
    expect(fewer.groups[1].memberIds).toBeUndefined();
    expect(fewer.groups[1].tasks).toEqual(["2階"]);
  });
});

describe("rotationConfigForPreset", () => {
  const wednesday = new Date(2026, 8, 30, 15); // 2026-09-30(水)

  it("手で送るなら日付の設定は付けない", () => {
    expect(rotationConfigForPreset("manual", wednesday)).toBeUndefined();
  });

  it("毎週は今週の月曜から 7 日ごと", () => {
    const config = rotationConfigForPreset("weekly", wednesday)!;
    expect(config).toEqual({
      mode: "date",
      startDate: "2026-09-28",
      cycleDays: 7,
    });
    // 次の月曜で 1 つ進む
    expect(
      computeDateRotationForDate(config, 3, parseIsoDateLocal("2026-10-04")!)
    ).toBe(0);
    expect(
      computeDateRotationForDate(config, 3, parseIsoDateLocal("2026-10-05")!)
    ).toBe(1);
  });

  it("平日ごとは土日祝を休み、今日が最初の順番になる", () => {
    const config = rotationConfigForPreset("weekdays", wednesday)!;
    expect(config).toMatchObject({
      startDate: "2026-09-30",
      cycleDays: 1,
      skipSaturday: true,
      skipSunday: true,
      skipHolidays: true,
    });
    // 9/30(水) が最初、10/2(金) で 2 つ進み、土日は金曜の担当のまま、月曜で 3 つ目
    const at = (date: string) =>
      computeDateRotationForDate(config, 10, parseIsoDateLocal(date)!);
    expect(at("2026-09-30")).toBe(0);
    expect(at("2026-10-02")).toBe(2);
    expect(at("2026-10-04")).toBe(2);
    expect(at("2026-10-05")).toBe(3);
  });

  it("土日に作った平日ごとの表は、次の月曜が最初の順番になる", () => {
    const sunday = new Date(2026, 9, 4);
    expect(rotationConfigForPreset("weekdays", sunday)!.startDate).toBe(
      "2026-10-05"
    );
  });
});
