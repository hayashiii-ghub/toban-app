import { describe, expect, it } from "vitest";
import { createScheduleSchema } from "../../../../server/schemas/schedule";
import { LIMITS } from "@shared/limits";
import type { AssignmentMode, Member } from "@/rotation/types";
import { createSettingsDraft, prepareSettingsSave } from "./settingsDraft";

const member = (id: string, skipped = false): Member => ({
  id,
  name: id,
  skipped,
  color: "#3B82F6",
  bgColor: "#DBEAFE",
  textColor: "#1E3A5F",
});

describe("編集内容の保存互換性", () => {
  it.each([
    ["member", 1, 3],
    ["member", 3, 1],
    ["task", 1, 3],
    ["task", 3, 1],
  ] as [AssignmentMode, number, number][])(
    "%sモードで仕事%s組・人%s人でも、順番とIDを保って保存できる",
    (assignmentMode, groupCount, memberCount) => {
      const draft = createSettingsDraft(
        {
          name: "掃除当番",
          assignmentMode,
          groups: Array.from({ length: groupCount }, (_, index) => ({
            id: `g${index}`,
            tasks: [`仕事${index}`, ""],
            emoji: "🧹",
          })),
          members: Array.from({ length: memberCount }, (_, index) =>
            member(`m${index}`, index === memberCount - 1 && memberCount > 1)
          ),
        },
        "standard"
      );
      const original = structuredClone(draft);
      const result = prepareSettingsSave(draft, draft.name);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("Valid roster was rejected");
      expect(result.settings.members).toEqual(original.members);
      expect(result.settings.groups.map(group => group.id)).toEqual(
        original.groups.map(group => group.id)
      );
      expect(
        result.settings.groups.every(group => group.tasks.length === 1)
      ).toBe(true);
      expect(
        createScheduleSchema.safeParse({ ...result.settings, rotation: 0 })
          .success
      ).toBe(true);
      expect(draft).toEqual(original);
    }
  );

  it("上限を超える仕事は切り捨てず保存を止め、減らせばサーバーに保存できる", () => {
    const draft = createSettingsDraft(
      {
        name: "掃除当番",
        groups: [
          {
            id: "g1",
            tasks: Array.from(
              { length: LIMITS.tasksPerGroup + 1 },
              (_, index) => String(index)
            ),
            emoji: "🧹",
          },
        ],
        members: [member("m1")],
      },
      "standard"
    );
    expect(prepareSettingsSave(draft, draft.name)).toMatchObject({
      ok: false,
      key: "settings.maxTasksReached",
    });
    expect(draft.groups[0].tasks).toHaveLength(LIMITS.tasksPerGroup + 1);
    const corrected = {
      ...draft,
      groups: [
        { ...draft.groups[0], tasks: draft.groups[0].tasks.slice(0, -1) },
      ],
    };
    const result = prepareSettingsSave(corrected, corrected.name);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Corrected roster was rejected");
    expect(
      createScheduleSchema.safeParse({ ...result.settings, rotation: 0 })
        .success
    ).toBe(true);
  });
});
