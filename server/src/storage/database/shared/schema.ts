import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean, index, serial } from "drizzle-orm/pg-core";

export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const recipes = pgTable(
  "recipes",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 128 }).notNull(),
    cuisine: varchar("cuisine", { length: 32 }).notNull().default("家常菜"),
    category: varchar("category", { length: 32 }).notNull().default("homestyle"),
    description: text("description"),
    image: text("image"),
    time: varchar("time", { length: 32 }).notNull().default("30分钟"),
    calories: varchar("calories", { length: 32 }).notNull().default("300千卡"),
    difficulty: varchar("difficulty", { length: 16 }).notNull().default("简单"),
    ingredients: jsonb("ingredients").notNull(),
    steps: jsonb("steps").notNull(),
    likes_count: integer("likes_count").notNull().default(0),
    is_ai_generated: boolean("is_ai_generated").notNull().default(false),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("recipes_cuisine_idx").on(table.cuisine),
    index("recipes_category_idx").on(table.category),
    index("recipes_likes_count_idx").on(table.likes_count),
    index("recipes_created_at_idx").on(table.created_at),
  ]
);

export const recipe_likes = pgTable(
  "recipe_likes",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    recipe_id: varchar("recipe_id", { length: 36 }).notNull().references(() => recipes.id, { onDelete: "cascade" }),
    user_id: varchar("user_id", { length: 64 }).notNull().default("anonymous"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("recipe_likes_recipe_id_idx").on(table.recipe_id),
    index("recipe_likes_user_id_idx").on(table.user_id),
  ]
);

export const weekly_plans = pgTable(
  "weekly_plans",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 64 }).notNull().default("anonymous"),
    plan_data: jsonb("plan_data").notNull(),
    filters: jsonb("filters"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("weekly_plans_user_id_idx").on(table.user_id),
    index("weekly_plans_created_at_idx").on(table.created_at),
  ]
);
