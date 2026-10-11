export type LanguageId = "js" | "python" | "terminal" | "plain";

/**
 * Turns a plaintext message into its display-encoded form for the chosen
 * language. This is a presentational effect, not real security — the
 * anonymity of who sent it is the actual privacy guarantee. These just make
 * the reveal feel earned instead of being readable at a glance.
 */
export function encodeMessage(message: string, language: LanguageId): string {
  switch (language) {
    case "js":
      return btoa(message);
    case "python":
      return rot13(message);
    case "terminal":
      return toHex(message);
    case "plain":
      return message;
  }
}

/** Reverses encodeMessage() for the same language. */
export function decodeMessage(value: string, language: LanguageId): string {
  switch (language) {
    case "js":
      return atob(value);
    case "python":
      return rot13(value); // ROT13 is its own inverse — encoding it twice returns the original
    case "terminal":
      return fromHex(value);
    case "plain":
      return value;
  }
}

function rot13(str: string): string {
  return str.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

function toHex(str: string): string {
  return Array.from(str)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): string {
  // Simple ASCII round-trip — good enough for this demo, not meant to
  // handle full multi-byte Unicode confessions.
  const bytes = hex.match(/.{1,2}/g) || [];
  return bytes.map((b) => String.fromCharCode(parseInt(b, 16))).join("");
}
