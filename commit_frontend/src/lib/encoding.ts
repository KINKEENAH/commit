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
      return toBase64(message);
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
      return fromBase64(value);
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

// btoa()/atob() only handle Latin-1, so emoji, curly quotes, em dashes and
// accented letters make them throw (and blank the page). Going through
// UTF-8 bytes first handles any text, and round-trips exactly.
const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder();

function toBase64(str: string): string {
  let binary = "";
  utf8Encoder.encode(str).forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function fromBase64(b64: string): string {
  const binary = atob(b64);
  return utf8Decoder.decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

// Hex of the UTF-8 bytes, which is also what `xxd -r -p` turns back into text.
function toHex(str: string): string {
  return Array.from(utf8Encoder.encode(str), (b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): string {
  const pairs = hex.match(/.{1,2}/g) || [];
  return utf8Decoder.decode(Uint8Array.from(pairs, (h) => parseInt(h, 16)));
}
