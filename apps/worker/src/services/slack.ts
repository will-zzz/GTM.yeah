import { UpstreamError } from "../lib/errors";
import { getFlakiness, shouldFail } from "../lib/resilience";
import type { Env, Lead } from "../types";

const CHANNEL = "#gtm-handoffs";

/**
 * Mock outbound Slack alert. Because it's an OUTBOUND call it respects the
 * flakiness flag: when chaos is ON it fails ~50% of the time by throwing an
 * UpstreamError, letting the webhook route demonstrate graceful degradation
 * (the lead still persists even if the alert can't be delivered).
 */
export async function sendSlackAlert(
  env: Env,
  { lead }: { lead: Lead },
): Promise<{ delivered: boolean }> {
  const flaky = await getFlakiness(env);
  if (flaky && shouldFail()) {
    throw new UpstreamError("Slack", {
      leadId: lead.id,
      channel: CHANNEL,
      mode: "outbound-drop",
    });
  }

  console.log(
    JSON.stringify({
      level: "info",
      type: "SlackAlert",
      channel: CHANNEL,
      text: `New CPA-ready lead: ${lead.companyName} — Lead Score ${lead.leadScore} (${lead.priority}). ${lead.pitchHook}`,
    }),
  );

  return { delivered: true };
}
