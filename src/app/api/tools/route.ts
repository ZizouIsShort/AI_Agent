import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

export async function POST(request: Request) {
  const { query } = await request.json();
  if (query) {
    console.log(query);

    const cnPdfContext = `
    To study and execute the basic commands of Cisco Packet Tracer by configuring
    a simple peer-to-peer network and verifying connectivity using ping and tracert
    utilities. Additionally, to assign IP addresses manually and test end-to-end
    communication across devices. As an extension, configure static routes or
    subnetting to demonstrate inter-network communication.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an AI agent responsible for deciding whether a user query requires
        consulting a specific tool.

        Tool description:
        The tool provides access to the user's Computer Networks course PDFs, which include
        hands-on Cisco Packet Tracer experiments such as configuring peer-to-peer networks,
        assigning IP addresses, verifying connectivity using ping and tracert, and basic
        routing or subnetting demonstrations.

        User query:
        "${cnPdfContext}"

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
      response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    console.log(decision);
    if (decision === "YES") {
      console.log("USE THIS TOOL");
      const embeddingResponse = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: query,
      });

      if (
        !embeddingResponse.embeddings ||
        embeddingResponse.embeddings.length === 0
      ) {
        throw new Error("No embeddings returned");
      }

      const embeddedQuery = embeddingResponse.embeddings[0].values;
      console.log(embeddedQuery);

      return NextResponse.json({ message: "Tool is being used" });
    }
    return NextResponse.json({
      message: "Query received but tool isnt being used",
    });
  }
  return NextResponse.json({
    message: "LOL",
  });
}
