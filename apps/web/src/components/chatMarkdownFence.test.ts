import { describe, expect, it } from "vitest";
import { extractFenceLanguage, isMermaidFence, normalizeFenceLanguage } from "./chatMarkdownFence";

describe("chatMarkdownFence", () => {
  it("detects mermaid fences", () => {
    expect(extractFenceLanguage("language-mermaid")).toBe("mermaid");
    expect(isMermaidFence("mermaid")).toBe(true);
  });

  it("normalizes mmd aliases to mermaid", () => {
    expect(extractFenceLanguage("foo language-mmd bar")).toBe("mmd");
    expect(normalizeFenceLanguage("mmd")).toBe("mermaid");
    expect(isMermaidFence("mmd")).toBe(true);
  });

  it("leaves non-mermaid languages unchanged", () => {
    expect(normalizeFenceLanguage("ts")).toBe("ts");
    expect(isMermaidFence("ts")).toBe(false);
  });

  it("falls back safely when the class name is absent", () => {
    expect(extractFenceLanguage(undefined)).toBe("text");
    expect(isMermaidFence(extractFenceLanguage(undefined))).toBe(false);
  });

  it("maps gitignore fences to ini for shiki fallback", () => {
    expect(extractFenceLanguage("language-gitignore")).toBe("ini");
  });
});
