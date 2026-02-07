console.log("SCHEMA FILE LOADED");
import { pgTable, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: varchar({ length: 255 }).primaryKey(),
  email: varchar({ length: 255 }).notNull().unique(),
});
