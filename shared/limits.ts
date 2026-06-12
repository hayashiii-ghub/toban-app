/**
 * 入力文字数・件数の上限。server スキーマ（server/schemas/schedule.ts）、
 * UI の maxLength、WebMCP の入力検証（useTobanTools）が共有する単一の真実源。
 * 値を変える場合は3経路すべてに効くことを前提に判断する。
 */
export const LIMITS = {
  /** 当番表の名前 */
  scheduleName: 100,
  /** メンバー名 */
  memberName: 100,
  /** タスク1件の文字数 */
  task: 100,
  /** グループの絵文字 */
  emoji: 10,
  /** メンバー数 */
  members: 50,
  /** グループ数 */
  groups: 20,
  /** 1グループあたりのタスク数 */
  tasksPerGroup: 20,
} as const;
