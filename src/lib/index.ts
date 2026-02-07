import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema"; // Ensure this matches your schema file

// Initialize PostgreSQL client
const client = postgres(process.env.DATABASE_URL!, { ssl: "require" });

// Drizzle instance
export const db = drizzle(client, { schema });
