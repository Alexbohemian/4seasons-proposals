"use server";

import { createClient } from "@/utils/supabase/server";

export async function generateWithAI(prompt: string, context: string) {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("company_settings")
    .select("gemini_api_key, company_name")
    .single();

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

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\nContext: ${context}\n\nRequest: ${prompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI generation failed: ${error}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
}

export async function suggestLineItems(projectDescription: string) {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("company_settings")
    .select("gemini_api_key")
    .single();

  const apiKey = settings?.gemini_api_key;
  if (!apiKey) {
    throw new Error("Gemini API key not configured.");
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

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
      }),
    }
  );

  if (!response.ok) throw new Error("AI suggestion failed");

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  return [];
}
