AI Chat Application (RAG + Web Search)

This project is a full-stack AI chat application built using a custom Retrieval Augmented Generation (RAG) pipeline and a dynamic web-search tool.

The goal was to design a system where the model can intelligently decide how to answer a query — either by using structured document knowledge or by retrieving live information from the web.

🚀 Features
1️⃣ RAG as a Tool

The model can use a custom RAG pipeline when a query requires document-grounded knowledge.

Workflow:

User submits a query

The LLM decides whether document retrieval is required

If required:

Query is embedded

Relevant chunks are retrieved from Pinecone

Context is passed to the model

Response is generated strictly from retrieved data

If not required:

The model answers normally without RAG

This allows selective retrieval instead of blindly using documents every time.

2️⃣ Web Search Tool

The application also includes a custom web-search pipeline.

Workflow:

Fetch results from DuckDuckGo

Extract top 3 links

Scrape and clean HTML content using Cheerio

Chunk and embed the content

Rank chunks using cosine similarity

Pass top ranked chunks to the LLM

Generate grounded answer with sources

The response includes the URLs used for generation.

3️⃣ Persistent Conversations

Chat history is stored in Postgres

Conversations can be resumed anytime

Previous messages are used as additional context

Sources (if present) are stored and displayed when loading old conversations

🧠 Architecture Overview

User Query
↓
LLM Decision Layer
↓
RAG Tool OR Web Search Tool OR Direct LLM
↓
Context Construction
↓
Response Generation
↓
Store conversation + sources

🛠 Tech Stack

Frontend:

Next.js (App Router)

Tailwind CSS

Clerk Authentication

Backend:

Next.js API Routes

Gemini Models (Generation + Embeddings)

Pinecone (Vector Database)

Supabase (Postgres)

Drizzle ORM

Cheerio (HTML Parsing)

DuckDuckGo Search Endpoint

📂 Core Concepts Implemented

Tool selection using LLM reasoning

Retrieval Augmented Generation

Vector similarity search

Dynamic web scraping + ranking

Conversation memory

Source attribution

Mobile responsive UI

⚠️ Notes

Web scraping is limited to top 3 results for performance

Chunk size and overlap are optimized for embedding quality

Sources are stored per assistant response

UI is minimal — architecture and tooling were the primary focus
