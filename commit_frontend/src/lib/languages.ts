import type { LanguageId } from "./encoding";

export type Language = {
  id: LanguageId;
  icon: string;
  name: string;
  tagline: string;
  /** Short label shown top-right of the code block, e.g. "JS", "PY". */
  tag: string;
};

export const LANGUAGES: Language[] = [
  { id: "js", icon: "</>", name: "JavaScript", tagline: "Familiar. Clever.", tag: "JS" },
  { id: "python", icon: ">_", name: "Python", tagline: "Simple. Subtle.", tag: "PY" },
  { id: "terminal", icon: "$ _", name: "Terminal", tagline: "Short. Mysterious.", tag: "SH" },
  { id: "plain", icon: "Aa", name: "Plain text", tagline: "No code. Just words.", tag: "TXT" },
];

export function getLanguage(id: LanguageId): Language {
  return LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[0];
}
