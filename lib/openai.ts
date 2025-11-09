/**
 * OpenAI integration for lab data extraction
 */

import OpenAI from "openai";

// Lazy initialization to avoid build-time errors when API key is not set
function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function extractLabDataFromImage(
  imageBuffer: Buffer,
  mimeType: string
): Promise<any> {
  const openai = getOpenAIClient();

  // Convert buffer to base64
  const base64Image = imageBuffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64Image}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract lab results from this image. Return a JSON object with: title, date, hospital, doctor, and parameters array with name, value, unit, and referenceRange for each lab parameter.",
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error("No JSON found in OpenAI response");
  } catch (error) {
    console.error("OpenAI extraction error:", error);
    throw error;
  }
}

/**
 * Extract lab data from text (e.g., text extracted from Azure Computer Vision)
 */
export async function extractLabDataFromText(
  text: string
): Promise<any> {
  const openai = getOpenAIClient();

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `Extract lab results from the following text. Return a JSON object with: title, date, hospital, doctor, and parameters array with name, value, unit, and referenceRange for each lab parameter.

Text:
${text}

Return only valid JSON.`,
        },
      ],
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error("No JSON found in OpenAI response");
  } catch (error) {
    console.error("OpenAI text extraction error:", error);
    throw error;
  }
}

