import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/index";
import { messages } from "@/db/schema";

export async function POST(request: Request) {
  const body = await request.json();
  const convo_id = body.conversationId;

  if (!convo_id) {
    return NextResponse.json({ messages: [] });
  }

  const chats = await db.execute(
    sql`SELECT role, content, source FROM ${messages} WHERE conversation_id = ${convo_id} ORDER BY created_at ASC`,
  );

  return NextResponse.json({
    messages: chats,
  });
}
