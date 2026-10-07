import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * テーブルの正本は server/db/migrations/ の手書き SQL。列を足したら、ここと
 * ensureSchema.ts の REQUIRED_SCHEDULE_COLUMNS も揃える。
 * インデックスは migrations 側にだけある（slug は UNIQUE 制約、0006 で is_public, updated_at）。
 */
export const schedules = sqliteTable("schedules", {
  id: text("id").primaryKey(),
  slug: text("slug").unique().notNull(),
  editToken: text("edit_token").notNull(),
  editTokenHash: text("edit_token_hash"),
  isPublic: integer("is_public", { mode: "boolean" }).default(false).notNull(),
  name: text("name").notNull(),
  rotation: integer("rotation").default(0).notNull(),
  groupsJson: text("groups_json").notNull(),
  membersJson: text("members_json").notNull(),
  rotationConfigJson: text("rotation_config_json"),
  assignmentMode: text("assignment_mode"),
  designThemeId: text("design_theme_id"),
  fontId: text("font_id"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  // カレンダーが購読 URL を最後に読みに来た日時。読まれている間は 1 年の削除の対象にしない
  calendarAccessedAt: text("calendar_accessed_at"),
});
