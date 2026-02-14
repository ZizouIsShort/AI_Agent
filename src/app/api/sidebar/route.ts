import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/index";
import { conversations } from "@/db/schema";

export async function POST(request: Request) {
  const response = await request.json();
  const user_id = response.user_id;
  const sbar = await db.execute(
    sql`SELECT title, id FROM ${conversations} WHERE user_id = ${user_id} ORDER BY created_at ASC`,
  );
  console.log(sbar);
  return NextResponse.json({
    sbarWork: sbar,
  });
}
