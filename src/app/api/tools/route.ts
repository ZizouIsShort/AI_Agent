import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { query } = await request.json();
  if (query) {
    console.log(query);
    return NextResponse.json({ message: "Query received" });
  }
  return NextResponse.json({
    message: "LOL",
  });
}
