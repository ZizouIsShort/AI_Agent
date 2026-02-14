import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/index";
import { messages } from "@/db/schema";

export async function POST(request: Request) {
  const response = await request.json();
  const convo_id = response.conversationId;
  const chats = await db.execute(
    sql`SELECT * FROM ${messages} WHERE conversation_id = ${convo_id} ORDER BY created_at ASC`,
  );
  console.log(chats);
  return NextResponse.json({
    messages: chats,
  });
}
