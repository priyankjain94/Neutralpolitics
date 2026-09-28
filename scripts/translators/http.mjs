/**
 * Posts the English fields to TRANSLATION_HTTP_URL.
 * Expected JSON response: { engine, model, fields: { title, standfirst, body, key_facts, sides, not_confirmed, factcheck_claim, factcheck_evidence } }
 * Do not put API keys in the repo. Set TRANSLATION_HTTP_KEY in the environment.
 */
import fs from "node:fs";
import path from "node:path";

export const id = "http";

export async function translate(fields) {
  const url = process.env.TRANSLATION_HTTP_URL;
  if (!url) throw new Error("TRANSLATION_HTTP_URL is not set");
  const glossaryPath = path.join(process.cwd(), "content", "glossary.json");
  const glossary = JSON.parse(fs.readFileSync(glossaryPath, "utf8"));
  const headers = { "content-type": "application/json" };
  if (process.env.TRANSLATION_HTTP_KEY) headers.authorization = `Bearer ${process.env.TRANSLATION_HTTP_KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      source_lang: "en",
      target_lang: "hi",
      glossary_version: glossary.version,
      glossary,
      instructions: glossary.notes,
      fields,
    }),
  });
  if (!response.ok) throw new Error(`Translator responded ${response.status}`);
  const data = await response.json();
  if (!data.fields?.title || !data.fields?.body) throw new Error("Translator response is missing fields.title or fields.body");
  return {
    engine: data.engine || "http",
    model: data.model || null,
    fields: data.fields,
    note: data.note || "",
  };
}
