import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import * as cheerio from "cheerio";
import { sql } from "drizzle-orm";
import { db } from "@/lib/index";
import { conversations, messages } from "@/db/schema";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

export async function POST(request: Request) {
  const response = await request.json();
  if (response) {
    console.log(response);
    const convo_id = response.conversationId;
    const user_id = response.user_id;
    const query = response.query;
    console.log(convo_id);
    console.log(user_id);
    console.log(query);

    const web_search = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query ?? "")}`,
      {
        method: "GET",
        headers: { "User-Agent": "Mozilla/5.0" },
      },
    );

    const html = await web_search.text();

    const $ = cheerio.load(html);
    const results: { title: string; url: string }[] = [];

    $(".result__title a").each((index, element) => {
      if (index >= 5) return false;

      const title = $(element).text().trim();
      const url = $(element).attr("href") || "";

      try {
        const urlObj = new URL("https://duckduckgo.com" + url);
        const realUrl = urlObj.searchParams.get("uddg");

        results.push({
          title,
          url: realUrl ? decodeURIComponent(realUrl) : url,
        });
      } catch {
        results.push({ title, url });
      }
    });

    console.log(results);

    return NextResponse.json({
      topResults: results,
    });
  } else {
    return NextResponse.json({
      message: "didnt get anything",
    });
  }
}
