import { NextResponse } from "next/server";
import { currentUser, auth } from "@clerk/nextjs/server";

export async function GET(request: Request) {
  console.log(request);
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await currentUser();
  return NextResponse.json({ user });
}
