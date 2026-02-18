import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import * as cheerio from "cheerio";
import { sql } from "drizzle-orm";
import { db } from "@/lib/index";
import { conversations, messages } from "@/db/schema";
import { chunkText } from "@/lib/chunk";
import { embedText } from "@/lib/embed";
import { cosineSimilarity } from "@/lib/similarity";

type Chunk = {
  title: string;
  url: string;
  content: string;
};

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

export async function POST(request: Request) {
  const now = new Date().toISOString();
  const response = await request.json();
  if (response) {
    console.log(response);
    const convo_id = response.conversationId;
    const user_id = response.user_id;
    const query = response.query;
    console.log(convo_id);
    console.log(user_id);
    console.log(query);

    if (convo_id == "") {
      const title_setter = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Here is a query ${query}. Generate a small single line title for this query `,
      });
      console.log(title_setter.candidates?.[0]?.content?.parts?.[0]?.text);
      const title = title_setter.candidates?.[0]?.content?.parts?.[0]?.text;
      const new_convo = await db.execute(
        sql`INSERT INTO ${conversations} (user_id, title, created_at, updated_at) VALUES (${user_id}, ${title}, ${now}, ${now}) RETURNING *`,
      );
      const convo_id = new_convo[0].id;
      console.log(convo_id);
      const web_search = await fetch(
        `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query ?? "")}`,
        {
          method: "GET",
          headers: { "User-Agent": "Mozilla/5.0" },
        },
      );

      const html = await web_search.text();

      const $ = cheerio.load(html);

      type SearchResult = {
        title: string;
        url: string;
        content: string;
      };

      const results: SearchResult[] = [];

      $(".result__title a").each((index, element) => {
        if (index >= 3) return false;

        const title = $(element).text().trim();
        const rawUrl = $(element).attr("href") || "";

        let finalUrl = rawUrl;

        try {
          const urlObj = new URL("https://duckduckgo.com" + rawUrl);
          const realUrl = urlObj.searchParams.get("uddg");
          finalUrl = realUrl ? decodeURIComponent(realUrl) : rawUrl;
        } catch {
          finalUrl = rawUrl;
        }

        results.push({
          title,
          url: finalUrl,
          content: "",
        });
      });

      console.log("Search results:", results);

      for (let i = 0; i < results.length; i++) {
        try {
          const pageRes = await fetch(results[i].url, {
            headers: { "User-Agent": "Mozilla/5.0" },
          });

          const pageHtml = await pageRes.text();
          const $$ = cheerio.load(pageHtml);

          $$("script, style, noscript").remove();

          const bodyText = $$("body").text();

          const cleanedText = bodyText
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 5000);

          results[i].content = cleanedText;
        } catch (err) {
          results[i].content = "Failed to fetch content";
        }
      }

      console.log("Results with content:", results);

      const allChunks: Chunk[] = [];

      for (const page of results) {
        if (!page.content || page.content === "Failed to fetch content")
          continue;

        const chunks = chunkText(page.content, 1000, 200);

        for (const chunk of chunks) {
          allChunks.push({
            title: page.title,
            url: page.url,
            content: chunk,
          });
        }
      }

      console.log("Total chunks:", allChunks.length);

      const queryEmbedding = await embedText(query);

      const scoredChunks: {
        title: string;
        url: string;
        content: string;
        score: number;
      }[] = [];

      for (const chunk of allChunks) {
        try {
          const chunkEmbedding = await embedText(chunk.content);
          const score = cosineSimilarity(queryEmbedding, chunkEmbedding);

          scoredChunks.push({
            ...chunk,
            score,
          });
        } catch (err) {
          console.log("Embedding failed for chunk");
        }
      }

      scoredChunks.sort((a, b) => b.score - a.score);

      const topChunks = scoredChunks.slice(0, 3);

      console.log("Top ranked chunks:", topChunks);

      const contextText = topChunks
        .map(
          (chunk, index) =>
            ` Source ${index + 1}
              Title: ${chunk.title}
              URL: ${chunk.url}

              ${chunk.content}
            `,
        )
        .join("\n\n");

      const answerResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: ` You are an AI assistant.

              Use ONLY the context below to answer the user's question.

              Context:
              ${contextText}

              User question:
              "${query}"

              Instructions:
              - Answer clearly and concisely.
              - If the context does not contain enough information, say so.
              - Mention which source number(s) you used.
              `,
      });

      const finalAnswer =
        answerResponse.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      console.log("Final Answer:", finalAnswer);

      const role_user = "user";
      const first_message_user = await db.execute(
        sql`INSERT INTO ${messages} (conversation_id, role, content, created_at) VALUES (${convo_id}, ${role_user}, ${query}, ${now}) RETURNING *`,
      );
      console.log(first_message_user);

      const usedSources = Array.from(
        new Set(topChunks.map((chunk) => chunk.url)),
      );

      console.log(usedSources);
      const role_llm = "assistant";
      const first_message_llm = await db.execute(
        sql`INSERT INTO ${messages} (conversation_id ,role, content, created_at, source) VALUES (${convo_id}, ${role_llm}, ${finalAnswer}, ${now}, ${usedSources.join(", ")}) RETURNING *`,
      );
      console.log(first_message_llm);

      return NextResponse.json({
        message: "the convo begins",
        convor_id: convo_id,
        response: finalAnswer,
        source: usedSources.join(", "),
      });
    }
    const web_search = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query ?? "")}`,
      {
        method: "GET",
        headers: { "User-Agent": "Mozilla/5.0" },
      },
    );

    const html = await web_search.text();

    const $ = cheerio.load(html);

    type SearchResult = {
      title: string;
      url: string;
      content: string;
    };

    const results: SearchResult[] = [];

    $(".result__title a").each((index, element) => {
      if (index >= 3) return false;

      const title = $(element).text().trim();
      const rawUrl = $(element).attr("href") || "";

      let finalUrl = rawUrl;

      try {
        const urlObj = new URL("https://duckduckgo.com" + rawUrl);
        const realUrl = urlObj.searchParams.get("uddg");
        finalUrl = realUrl ? decodeURIComponent(realUrl) : rawUrl;
      } catch {
        finalUrl = rawUrl;
      }

      results.push({
        title,
        url: finalUrl,
        content: "",
      });
    });

    console.log("Search results:", results);

    for (let i = 0; i < results.length; i++) {
      try {
        const pageRes = await fetch(results[i].url, {
          headers: { "User-Agent": "Mozilla/5.0" },
        });

        const pageHtml = await pageRes.text();
        const $$ = cheerio.load(pageHtml);

        $$("script, style, noscript").remove();

        const bodyText = $$("body").text();

        const cleanedText = bodyText.replace(/\s+/g, " ").trim().slice(0, 5000); // limit size (VERY important)

        results[i].content = cleanedText;
      } catch (err) {
        results[i].content = "Failed to fetch content";
      }
    }

    console.log("Results with content:", results);

    const allChunks: Chunk[] = [];

    for (const page of results) {
      if (!page.content || page.content === "Failed to fetch content") continue;

      const chunks = chunkText(page.content, 1000, 200);

      for (const chunk of chunks) {
        allChunks.push({
          title: page.title,
          url: page.url,
          content: chunk,
        });
      }
    }

    console.log("Total chunks:", allChunks.length);

    const queryEmbedding = await embedText(query);

    const scoredChunks: {
      title: string;
      url: string;
      content: string;
      score: number;
    }[] = [];

    for (const chunk of allChunks) {
      try {
        const chunkEmbedding = await embedText(chunk.content);
        const score = cosineSimilarity(queryEmbedding, chunkEmbedding);

        scoredChunks.push({
          ...chunk,
          score,
        });
      } catch (err) {
        console.log("Embedding failed for chunk");
      }
    }

    scoredChunks.sort((a, b) => b.score - a.score);

    const topChunks = scoredChunks.slice(0, 3);

    console.log("Top ranked chunks:", topChunks);

    const contextText = topChunks
      .map(
        (chunk, index) =>
          ` Source ${index + 1}
            Title: ${chunk.title}
            URL: ${chunk.url}

            ${chunk.content}
          `,
      )
      .join("\n\n");

    const prev_messages = await db.execute(
      sql`SELECT role, content FROM ${messages} WHERE conversation_id = ${convo_id}  ORDER BY created_at ASC`,
    );
    console.log(prev_messages);
    const history = prev_messages as unknown as {
      role: string;
      content: string;
    }[];

    const formatted_history = history
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join("\n");

    const answerResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: ` You are an AI assistant.

            Use ONLY the context below and the users chat history to answer the user's question.

            Context:
            ${contextText}

            User question:
            "${query}"

            Chat History:
            "${formatted_history}"

            Instructions:
            - Answer clearly and concisely.
            - If the context and chat history does not contain enough information, say so.
            - Mention which source number(s) you used.
            `,
    });

    const finalAnswer =
      answerResponse.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    console.log("Final Answer:", finalAnswer);
    const usedSources = Array.from(
      new Set(topChunks.map((chunk) => chunk.url)),
    );
    const role_user = "user";
    const next_message_user = await db.execute(
      sql`INSERT INTO ${messages} (conversation_id, role, content, created_at) VALUES (${convo_id}, ${role_user}, ${query}, ${now}) RETURNING *`,
    );
    console.log(next_message_user);
    const role_llm = "assistant";
    const next_message_llm = await db.execute(
      sql`INSERT INTO ${messages} (conversation_id ,role, content, created_at, source) VALUES (${convo_id}, ${role_llm}, ${finalAnswer}, ${now}, ${usedSources.join(", ")}) RETURNING *`,
    );
    console.log(next_message_llm);
    return NextResponse.json({
      message: "the convo continues",
      convor_id: convo_id,
      response: finalAnswer,
      source: usedSources.join(", "),
    });
  } else {
    return NextResponse.json({
      message: "didnt get anything",
    });
  }
}
