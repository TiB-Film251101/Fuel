import { buildPrompt } from "./prompt.js";

const WORKER_URL = import.meta.env.VITE_WORKER_URL;
const SHARED_SECRET = import.meta.env.VITE_FUEL_SECRET;

function extractJSON(text) {
  const t = (text || "").trim();
  try { return JSON.parse(t); } catch {}
  const md = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (md) return JSON.parse(md[1].trim());
  const obj = t.match(/\{[\s\S]*\}/);
  if (obj) return JSON.parse(obj[0]);
  throw new SyntaxError("No valid JSON");
}

export async function recommend({ n, settings, genres, signals, excludeList }, retries = 2) {
  const prompt = buildPrompt({ n, settings, genres, signals, excludeList });

  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(WORKER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-fuel-secret": SHARED_SECRET,
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 2048,
          temperature: 0.5,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!res.ok) throw new Error(`API ${res.status}`);

      const data = await res.json();
      const text = data.content?.[0]?.text || "";
      const parsed = extractJSON(text);
      return parsed.recommendations || [];
    } catch (err) {
      if (i === retries) throw err;
    }
  }
}
