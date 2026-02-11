console.log("SCHEMA FILE LOADED");
import { uuid } from "drizzle-orm/pg-core";
import { pgTable, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: varchar({ length: 255 }).primaryKey(),
  email: varchar({ length: 255 }).notNull().unique(),
});

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: varchar("user_id", { length: 255 }).references(() => usersTable.id),
  title: varchar("title", { length: 255 }).notNull(),
  created_at: varchar("created_at", { length: 255 }).notNull(),
  updated_at: varchar("updated_at", { length: 255 }).notNull(),
});

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversation_id: uuid("conversation_id").references(() => conversations.id),
  role: varchar("role", { length: 40 }).notNull(),
  content: varchar("content", { length: 10000 }).notNull(),
  created_at: varchar("created_at", { length: 255 }).notNull(),
});
