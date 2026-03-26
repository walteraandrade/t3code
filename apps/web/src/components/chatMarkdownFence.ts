const CODE_FENCE_LANGUAGE_REGEX = /(?:^|\s)language-([^\s]+)/;

export type NormalizedFenceLanguage = string;

export function extractFenceLanguage(className: string | undefined): string {
  const match = className?.match(CODE_FENCE_LANGUAGE_REGEX);
  const raw = match?.[1] ?? "text";
  // Shiki doesn't bundle a gitignore grammar; ini is a close match (#685)
  return raw === "gitignore" ? "ini" : raw;
}

export function normalizeFenceLanguage(language: string): NormalizedFenceLanguage {
  switch (language.toLowerCase()) {
    case "mmd":
    case "mermaid":
      return "mermaid";
    default:
      return language;
  }
}

export function isMermaidFence(language: string): boolean {
  return normalizeFenceLanguage(language) === "mermaid";
}
