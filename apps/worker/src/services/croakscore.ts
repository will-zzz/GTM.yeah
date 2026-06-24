import type { CroakScoreResult, Env, Priority } from "../types";

interface CroakInput {
  companyName: string;
  domain: string | null;
}

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

function scoreToPriority(score: number): Priority {
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

/** Deterministic, offline-safe enrichment. Same input always yields same score. */
function mockCroak({ companyName, domain }: CroakInput): CroakScoreResult {
  const seed = domain || companyName || "unknown";
  const croakScore = hashString(seed) % 101; // 0-100
  const priority = scoreToPriority(croakScore);
  const vibe =
    priority === "High"
      ? "ready to leap"
      : priority === "Medium"
        ? "worth a hop"
        : "still settling into the pond";
  const pitchHook = `${companyName} looks ${vibe} — lead with automated month-end close and real-time books to win their finance team.`;
  return { croakScore, priority, pitchHook };
}

/**
 * Background utility called during ingestion. Mocks an LLM scan of the company's
 * domain to produce a 1-sentence pitch hook + priority. Uses Workers AI only
 * when explicitly enabled; otherwise the deterministic mock. NEVER throws —
 * any AI error falls back to the mock so ingestion can't be blocked by the LLM.
 */
export async function generateCroakScore(
  env: Env,
  input: CroakInput,
): Promise<CroakScoreResult> {
  const base = mockCroak(input);

  if (env.USE_REAL_AI === "true" && env.AI) {
    try {
      const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [
          {
            role: "system",
            content:
              "You are a B2B sales strategist for an AI-powered accounting firm. Reply with exactly ONE punchy sentence: a sales pitch hook. No preamble.",
          },
          {
            role: "user",
            content: `Company: ${input.companyName}. Domain: ${input.domain ?? "unknown"}. Write a one-sentence pitch hook.`,
          },
        ],
      });
      const text = (result as { response?: string }).response?.trim();
      return text ? { ...base, pitchHook: text } : base;
    } catch (e) {
      console.error(
        JSON.stringify({
          level: "warning",
          type: "AIFallback",
          message: "Workers AI failed; using mock CroakScore",
          cause: e instanceof Error ? e.message : String(e),
        }),
      );
    }
  }

  return base;
}
