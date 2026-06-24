/**
 * ID helpers. Uses the Workers-native crypto.randomUUID().
 */

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

/** Short, log-friendly request id used to correlate logs across a request. */
export function requestId(): string {
  return `req_${crypto.randomUUID().slice(0, 8)}`;
}
