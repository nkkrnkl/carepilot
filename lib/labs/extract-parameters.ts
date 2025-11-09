/**
 * Safe Lab Parameter Extraction
 * 
 * Uses LLM to extract structured lab parameters from text with validation.
 * Ensures data safety through schema validation and sanitization.
 */

import { z } from "zod";
import OpenAI from "openai";

// Zod schema for parameter validation (ensures type safety)
const LabParameterSchema = z.object({
  name: z.string().min(1).max(200), // Sanitize: limit length
  value: z.union([
    z.number(),
    z.string().max(50) // Sanitize: limit string values
  ]),
  unit: z.string().max(20).nullable().optional(), // Sanitize: limit unit length
  referenceRange: z.string().max(50).nullable().optional(), // Sanitize: limit range length
  flag: z.enum(["H", "L", "High", "Low", "↑", "↓", "N", "Normal"]).nullable().optional(),
});

const LabExtractSchema = z.object({
  title: z.string().max(200).nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(), // ISO date format
  hospital: z.string().max(200).nullable().optional(),
  doctor: z.string().max(200).nullable().optional(),
  parameters: z.array(LabParameterSchema).min(0).max(500), // Sanitize: limit parameter count
});

export type LabExtract = z.infer<typeof LabExtractSchema>;
export type LabParameter = z.infer<typeof LabParameterSchema>;

/**
 * Sanitize parameter name (remove special characters, normalize)
 */
function sanitizeParameterName(name: string): string {
  return name
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special chars except spaces and hyphens
    .replace(/\s+/g, " ") // Normalize whitespace
    .substring(0, 200); // Enforce max length
}

/**
 * Sanitize parameter value
 */
function sanitizeParameterValue(value: number | string): number | string {
  if (typeof value === "number") {
    // Validate numeric range (reasonable medical values)
    if (value < -1000 || value > 1000000) {
      throw new Error(`Parameter value out of range: ${value}`);
    }
    return value;
  }
  
  // String values: remove dangerous characters
  return value
    .trim()
    .replace(/[<>\"'&]/g, "") // Remove potentially dangerous chars
    .substring(0, 50);
}

/**
 * Extract lab parameters from text using LLM with validation
 * 
 * @param text - Extracted text from lab report
 * @returns Validated and sanitized lab parameters
 */
/**
 * Get OpenAI client (Azure OpenAI or standard OpenAI)
 */
function getOpenAIClient(): OpenAI {
  // Try Azure OpenAI first
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azureKey = process.env.AZURE_OPENAI_API_KEY;
  
  if (azureEndpoint && azureKey) {
    return new OpenAI({
      apiKey: azureKey,
      baseURL: `${azureEndpoint}openai/deployments/gpt-4o-mini`,
      defaultQuery: { "api-version": process.env.AZURE_OPENAI_API_VERSION || "2023-05-15" },
      defaultHeaders: {
        "api-key": azureKey,
      },
    });
  }
  
  // Fallback to standard OpenAI
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    throw new Error("AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY, or OPENAI_API_KEY must be set");
  }
  
  return new OpenAI({
    apiKey: openaiKey,
  });
}

export async function extractLabParameters(text: string): Promise<LabExtract> {
  const client = getOpenAIClient();
  
  const systemPrompt = `You are a medical lab report parser. Extract lab test results from the provided text.

CRITICAL RULES:
1. Extract ALL lab test parameters you find
2. For each parameter, extract: name, value, unit, referenceRange, flag (if abnormal)
3. Normalize parameter names (e.g., "HbA1c" → "A1C", "LDL-C" → "LDL")
4. Extract metadata: title, date (YYYY-MM-DD format), hospital, doctor
5. Return ONLY valid JSON matching the exact schema
6. If a field is missing, use null (not empty string)

Return JSON with this EXACT structure:
{
  "title": "string or null",
  "date": "YYYY-MM-DD or null",
  "hospital": "string or null",
  "doctor": "string or null",
  "parameters": [
    {
      "name": "string (normalized, e.g., 'A1C', 'LDL', 'Glucose')",
      "value": "number or string",
      "unit": "string or null (e.g., 'mg/dL', '%', 'mIU/L')",
      "referenceRange": "string or null (e.g., '0.6-1.2', '70-100')",
      "flag": "H|L|High|Low|↑|↓|N|Normal or null"
    }
  ]
}`;

  const userPrompt = `Extract all lab test results from this medical lab report text:

${text.substring(0, 15000)} // Limit input size for safety

Return ONLY the JSON object. No explanations, no markdown, just valid JSON.`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1, // Low temperature for consistent extraction
      response_format: { type: "json_object" }, // Force JSON output
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from LLM");
    }

    // Parse JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      throw new Error(`Invalid JSON response: ${e}`);
    }

    // Validate with Zod schema
    const validated = LabExtractSchema.parse(parsed);

    // Sanitize all parameters
    const sanitizedParameters = validated.parameters.map((param) => ({
      name: sanitizeParameterName(param.name),
      value: sanitizeParameterValue(param.value),
      unit: param.unit ? param.unit.trim().substring(0, 20) : null,
      referenceRange: param.referenceRange
        ? param.referenceRange.trim().substring(0, 50)
        : null,
      flag: param.flag || null,
    }));

    return {
      ...validated,
      parameters: sanitizedParameters,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      throw new Error(`Parameter extraction validation failed: ${error.errors[0]?.message}`);
    }
    throw error;
  }
}

