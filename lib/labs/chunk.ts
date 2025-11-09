/**
 * Chunking utilities for lab reports
 * 
 * MIRRORS the exact chunking strategy from claims:
 * - chunk_size: 1000 characters
 * - chunk_overlap: 200 characters
 * - strategy: "sentence" (default)
 * 
 * Builds semantically useful chunks with header and parameter-level blocks.
 */

import { LabReport } from "./types";

export interface LabChunk {
  index: number;
  text: string;
  meta: {
    paramName?: string;
    unit?: string;
    referenceRange?: string;
  };
}

/**
 * Chunk text by sentences (mirrors claims _chunk_by_sentence)
 */
function chunkBySentence(
  text: string,
  chunkSize: number,
  overlap: number
): string[] {
  // Split by sentence endings
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z])/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    // If adding this sentence would exceed chunk size
    if (currentChunk.length + trimmed.length + 1 > chunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        // Start new chunk with overlap
        if (overlap > 0 && currentChunk.length > overlap) {
          const overlapText = currentChunk.slice(-overlap);
          currentChunk = overlapText + " " + trimmed;
        } else {
          currentChunk = trimmed;
        }
      } else {
        // Sentence itself is too long, split it
        chunks.push(trimmed.substring(0, chunkSize));
        currentChunk = trimmed.substring(chunkSize - overlap);
      }
    } else {
      if (currentChunk) {
        currentChunk += " " + trimmed;
      } else {
        currentChunk = trimmed;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Build header chunk with document metadata
 */
function buildHeaderChunk(report: LabReport): string {
  const parts: string[] = [
    "Document Type: Lab Report",
  ];

  if (report.hospital) {
    parts.push(`Hospital: ${report.hospital}`);
  }
  if (report.doctor) {
    parts.push(`Doctor: ${report.doctor}`);
  }
  if (report.date) {
    parts.push(`Report Date: ${report.date}`);
  }

  return parts.join("\n");
}

/**
 * Build parameter-level chunks
 */
function buildParameterChunks(
  report: LabReport,
  chunkSize: number,
  overlap: number
): LabChunk[] {
  const chunks: LabChunk[] = [];
  let chunkIndex = 1; // Start at 1 (0 is header)

  for (const param of report.parameters) {
    const parts: string[] = [
      `Parameter: ${param.name}`,
      `Value: ${param.value}${param.unit ? ` ${param.unit}` : ""}`,
    ];

    if (param.referenceRange) {
      parts.push(`Reference Range: ${param.referenceRange}`);
    }

    const paramText = parts.join("\n");

    // If parameter text fits in one chunk, use it
    if (paramText.length <= chunkSize) {
      chunks.push({
        index: chunkIndex++,
        text: paramText,
        meta: {
          paramName: param.name,
          unit: param.unit || undefined,
          referenceRange: param.referenceRange || undefined,
        },
      });
    } else {
      // Split large parameter text by sentences
      const paramChunks = chunkBySentence(paramText, chunkSize, overlap);
      for (const chunkText of paramChunks) {
        chunks.push({
          index: chunkIndex++,
          text: chunkText,
          meta: {
            paramName: param.name,
            unit: param.unit || undefined,
            referenceRange: param.referenceRange || undefined,
          },
        });
      }
    }
  }

  return chunks;
}

/**
 * Build chunks from lab report
 * 
 * Returns header chunk + parameter chunks, using exact claims settings:
 * - chunk_size: 1000
 * - chunk_overlap: 200
 * - strategy: "sentence"
 */
export function buildLabsChunks(
  report: LabReport,
  chunkSize: number = 1000,
  chunkOverlap: number = 200
): { chunks: LabChunk[] } {
  const chunks: LabChunk[] = [];

  // Header chunk (index 0)
  const headerText = buildHeaderChunk(report);
  chunks.push({
    index: 0,
    text: headerText,
    meta: {},
  });

  // Parameter chunks
  const paramChunks = buildParameterChunks(report, chunkSize, chunkOverlap);
  chunks.push(...paramChunks);

  return { chunks };
}

