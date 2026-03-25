"use server";

import { createClient } from "@/utils/supabase/server";

// Helper: call Gemini API with automatic model fallback
async function callGemini(apiKey: string, contents: unknown[], generationConfig: unknown) {
  // Try models in order of preference
  const models = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
  ];

  let lastError = "";

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents, generationConfig }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      }

      lastError = await response.text();
      console.error(`Gemini model ${model} failed (${response.status}):`, lastError);

      // If it's a model-not-found error, try next model
      if (response.status === 404) continue;

      // For other errors (auth, rate limit), don't try other models
      throw new Error(`Gemini API error (${response.status}): ${lastError}`);
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("Gemini API error")) throw err;
      console.error(`Gemini model ${model} fetch error:`, err);
      continue;
    }
  }

  throw new Error(`All Gemini models failed. Last error: ${lastError}`);
}

export async function generateWithAI(prompt: string, context: string) {
  const supabase = await createClient();

  const { data: settings, error: settingsError } = await supabase
    .from("company_settings")
    .select("gemini_api_key, company_name")
    .single();

  if (settingsError) {
    console.error("Failed to load settings:", settingsError);
    throw new Error("Failed to load company settings from database.");
  }

  const apiKey = settings?.gemini_api_key;
  if (!apiKey) {
    throw new Error(
      "Gemini API key not configured. Go to Settings > Integrations to add your key."
    );
  }

  const systemPrompt = `You are a professional proposal writer for ${settings.company_name}, an artificial grass / turf installation company.
You help create professional, trust-building proposal content for residential and commercial clients.
Keep language professional but approachable. Be specific about what work will be done.
Always be concise and practical - these are working proposals, not marketing copy.`;

  const text = await callGemini(
    apiKey,
    [
      {
        role: "user",
        parts: [{ text: `${systemPrompt}\n\nContext: ${context}\n\nRequest: ${prompt}` }],
      },
    ],
    { temperature: 0.7, maxOutputTokens: 1024 }
  );

  return text || "No response generated.";
}

export async function suggestLineItems(projectDescription: string) {
  const supabase = await createClient();

  const { data: settings, error: settingsError } = await supabase
    .from("company_settings")
    .select("gemini_api_key")
    .single();

  if (settingsError) {
    console.error("Failed to load settings:", settingsError);
    throw new Error("Failed to load company settings.");
  }

  const apiKey = settings?.gemini_api_key;
  if (!apiKey) {
    throw new Error("Gemini API key not configured. Go to Settings > Integrations.");
  }

  const { data: templates } = await supabase
    .from("service_templates")
    .select("name, description, default_unit")
    .eq("is_active", true);

  const templateList = templates?.map((t) => `- ${t.name}: ${t.description} (${t.default_unit})`).join("\n") || "";

  const prompt = `Based on this project description for an artificial turf installation, suggest appropriate line items with estimated quantities.

Available services:
${templateList}

Project description: ${projectDescription}

Respond in this exact JSON format (no markdown, just JSON):
[
  {"description": "...", "quantity": number_or_null, "unit": "sqft/linear ft/each/job", "is_addon": false}
]

Only suggest relevant items. Include site prep, installation, and cleanup.`;

  const text = await callGemini(
    apiKey,
    [{ role: "user", parts: [{ text: prompt }] }],
    { temperature: 0.3, maxOutputTokens: 1024 }
  );

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = (text || "[]").match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  return [];
}
