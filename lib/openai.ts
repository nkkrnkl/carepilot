import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = "You are a medical document extractor. Return clean JSON only. Do not add commentary.";

const USER_PROMPT = `Extract the various parameters measured in this lab test, and other data including hospital name, doctor name, date. Use this JSON schema:

{
  "hospital": "string | null",
  "doctor": "string | null",
  "date": "YYYY-MM-DD or null",
  "title": "string | null", // optional report/test title if present
  "parameters": [
    {
      "name": "string",            // e.g., Hemoglobin
      "value": "string|number",    // e.g., 13.2
      "unit": "string|null",       // e.g., g/dL
      "referenceRange": "string|null" // e.g., 12-16
    }
  ]
}

Ensure parameter names are human-readable; do not abbreviate unless the report uses standard abbreviations (e.g., HDL). If multiple panels are present, include all parameters.`;

export async function extractLabDataFromImage(
  imageBuffer: Buffer,
  mimeType: string
): Promise<{ hospital: string | null; doctor: string | null; date: string | null; title?: string | null; parameters: Array<{ name: string; value: string | number; unit?: string | null; referenceRange?: string | null }> }> {
  const imageUrl = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: USER_PROMPT },
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
            },
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 4000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  try {
    const parsed = JSON.parse(content);
    return parsed;
  } catch (error) {
    throw new Error(`Failed to parse OpenAI response: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

