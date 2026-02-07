import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/index";
import { usersTable } from "@/db/schema";

export async function POST(req: Request) {
  const { id, email } = await req.json();

  const existingUser = await db.execute(
    sql`SELECT id FROM ${usersTable} WHERE id = ${id}`,
  );

  if (existingUser.length > 0) {
    return NextResponse.json(
      { message: "User already exists" },
      { status: 200 },
    );
  }

  const newUser = await db.execute(
    sql`INSERT INTO ${usersTable} (id, email) VALUES (${id}, ${email}) RETURNING *`,
  );

  return NextResponse.json(
    { message: "User created successfully", user: newUser[0] },
    { status: 201 },
  );
}
