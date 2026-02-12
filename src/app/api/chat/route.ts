import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { Pinecone } from "@pinecone-database/pinecone";
import { sql } from "drizzle-orm";
import { db } from "@/lib/index";
import { usersTable, conversations, messages } from "@/db/schema";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});
const pc = new Pinecone({
  apiKey: process.env.PINECONE!,
});
const index = pc.index("killme");

export async function POST(request: Request) {
  const now = new Date().toISOString();
  const response = await request.json();
  if (response) {
    console.log(response);
    console.log(response.conversationId);
    const convo_id = response.conversationId;
    const user_id = response.user_id;
    const query = response.query;
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
      console.log(new_convo);
      const llm_response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are an AI agent responsible for deciding whether a user query requires
          consulting a specific tool.

          Tool description:
          The tool provides access to the user's Computer Networks course PDFs, which include
          hands-on Cisco Packet Tracer experiments such as configuring peer-to-peer networks,
          assigning IP addresses, verifying connectivity using ping and tracert, and basic
          routing or subnetting demonstrations.

          User query:
          "${query}"

          Task:
          Decide whether answering the user query requires information grounded in the
          Computer Networks PDFs described above.

          Rules:
          - Respond with only "YES" or "NO".
          - Respond "YES" only if the user explicitly or implicitly expects information
            from the PDFs (e.g., summaries, explanations as per notes, lab-style steps,
            or references to Packet Tracer experiments).
          - Respond "NO" if the question can be answered using general knowledge alone.
          - Do not explain your reasoning.
          - Do not answer the user's question.

          Answer:
        `,
      });
      const decision =
        llm_response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      console.log(decision);
      if (decision === "YES") {
        console.log("USE THIS TOOL");
        const embeddingResponse = await ai.models.embedContent({
          model: "gemini-embedding-001",
          contents: query,
        });

        const embeddedQuery = embeddingResponse.embeddings?.[0]?.values;

        if (!embeddedQuery) {
          throw new Error("Embedding values missing");
        }
        const pineResult = await index.query({
          vector: embeddedQuery,
          topK: 5,
          namespace: "rag-data",
          includeMetadata: true,
        });
        const matches = pineResult.matches;

        if (!matches || matches.length === 0) {
          return NextResponse.json({
            message: "No relevant chunks found",
          });
        }

        const chunks = matches
          .map((match) => match.metadata?.text)
          .filter((text): text is string => Boolean(text));

        const toolResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `
          You are an AI assistant answering questions using the provided context.

          Context:
          ${chunks.map((chunk, i) => `(${i + 1}) ${chunk}`).join("\n\n")}

          User question:
          "${query}"

          Instructions:
          - Answer the question using ONLY the information in the context above.
          - If the context does not contain enough information to answer the question, say:
            "The provided documents do not contain enough information to answer this question."
          - Do not use outside knowledge.
          - Be clear, concise, and accurate.

          Answer:
          `,
        });
        const answer = toolResponse.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!answer) {
          throw new Error("No answer returned by model");
        }
        console.log(answer);
        console.log("That was the answer\n");
        const role_user = "user";
        const first_message_user = await db.execute(
          sql`INSERT INTO ${messages} (role, content, created_at, updated_at) VALUES (${role_user}, ${query}, ${now}, ${now}) RETURNING *`,
        );
        console.log(first_message_user);
        const role_llm = "llm";
        const first_message_llm = await db.execute(
          sql`INSERT INTO ${messages} (role, content, created_at, updated_at) VALUES (${role_llm}, ${query}, ${now}, ${now}) RETURNING *`,
        );
        console.log(first_message_llm);
        return NextResponse.json({
          message: "first_convo added and tool used",
        });
      } else {
      }
      return NextResponse.json({
        message: "query received",
      });
    }
  }
}
