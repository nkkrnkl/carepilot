import { NextRequest, NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";

/**
 * Labs Search API Route
 * 
 * Mirrors claims retrieval pattern:
 * - Queries private namespace
 * - Filters by user_id and doc_type="lab_report"
 * - Returns topK results with metadata
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const userId = searchParams.get("userId") || "demo-user";
    const topK = parseInt(searchParams.get("topK") || "5");

    if (!query) {
      return NextResponse.json(
        { error: "Missing query parameter 'q'" },
        { status: 400 }
      );
    }

    // Generate query embedding (same as claims)
    const OpenAI = require("openai").default;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || process.env.EMBEDDING_DEPLOYMENT!;
    const client = new OpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY!,
      baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${deployment}`,
      defaultQuery: { "api-version": process.env.AZURE_OPENAI_API_VERSION || "2023-05-15" },
      defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY! },
    });

    const response = await client.embeddings.create({
      model: deployment,
      input: query,
    });

    const queryEmbedding = response.data[0].embedding;

    // Query Pinecone (same pattern as claims)
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    const index = pc.index("care-pilot");
    const results = await index.namespace("private").query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
      filter: {
        user_id: { $eq: userId },
        doc_type: { $eq: "lab_report" },
      },
    });

    return NextResponse.json({
      success: true,
      matches: results.matches.map((match) => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata,
      })),
      query,
      userId,
    });
  } catch (error) {
    console.error("Labs search error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 }
    );
  }
}
