import type { Env, LeadScoreResult, Priority } from "../types";

interface LeadScoreInput {
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

function mockLeadScore({ companyName, domain }: LeadScoreInput): LeadScoreResult {
  const seed = domain || companyName || "unknown";
  const leadScore = hashString(seed) % 101;
  const priority = scoreToPriority(leadScore);
  const pitchHook =
    priority === "High"
      ? `${companyName} is a strong fit for automated month-end close and real-time books — lead with ROI on finance team hours saved.`
      : priority === "Medium"
        ? `${companyName} shows solid potential — position Rivet as a faster close with fewer manual reconciliations.`
        : `${companyName} may need nurture — highlight compliance-ready reporting and scalable bookkeeping.`;
  return { leadScore, priority, pitchHook };
}

/**
 * Background enrichment during ingestion. Mocks an LLM scan of the company domain
 * to produce a 1-sentence pitch hook and priority score. Uses Workers AI only when
 * explicitly enabled; otherwise a deterministic mock. Never throws.
 */
export async function generateLeadScore(
  env: Env,
  input: LeadScoreInput,
): Promise<LeadScoreResult> {
  const base = mockLeadScore(input);

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
          message: "Workers AI failed; using mock Lead Score",
          cause: e instanceof Error ? e.message : String(e),
        }),
      );
    }
  }

  return base;
}
