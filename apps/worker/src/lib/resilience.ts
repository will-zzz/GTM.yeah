import type { MiddlewareHandler } from "hono";
import type { Env } from "../types";
import { ChaosFailure } from "./errors";

const FLAKINESS_KEY = "system:flakiness";

/** Reads the global flakiness flag from KV. Defaults to false. */
export async function getFlakiness(env: Env): Promise<boolean> {
  const value = await env.CACHE.get(FLAKINESS_KEY);
  return value === "true";
}

export async function setFlakiness(env: Env, on: boolean): Promise<void> {
  await env.CACHE.put(FLAKINESS_KEY, on ? "true" : "false");
}

/** 50/50 coin flip used to decide whether to drop a request/outbound call. */
export function shouldFail(): boolean {
  return Math.random() < 0.5;
}

/**
 * Chaos middleware: when flakiness is ON, fails ~50% of requests on opted-in
 * routes by throwing a ChaosFailure (caught by the global onError handler).
 * Apply this ONLY to write/ingest routes — never to GET reads or the toggle
 * endpoint, or the dashboard becomes unusable.
 */
export const chaosMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (
  c,
  next,
) => {
  const flaky = await getFlakiness(c.env);
  if (flaky && shouldFail()) {
    throw new ChaosFailure({
      route: new URL(c.req.url).pathname,
      method: c.req.method,
      mode: "inbound-drop",
    });
  }
  await next();
};
