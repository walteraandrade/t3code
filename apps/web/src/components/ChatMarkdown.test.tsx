import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("./MermaidBlock", () => ({
  MermaidBlock: ({ code, theme }: { code: string; theme: "light" | "dark" }) => (
    <div data-testid="mermaid-block" data-theme={theme}>
      {code}
    </div>
  ),
}));

vi.mock("../hooks/useTheme", () => ({
  useTheme: () => ({ theme: "light", resolvedTheme: "light", setTheme: () => {} }),
}));

function matchMedia() {
  return {
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

beforeAll(() => {
  const classList = {
    add: () => {},
    remove: () => {},
    toggle: () => {},
    contains: () => false,
  };

  vi.stubGlobal("localStorage", {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
  });
  vi.stubGlobal("window", {
    matchMedia,
    addEventListener: () => {},
    removeEventListener: () => {},
    desktopBridge: undefined,
  });
  vi.stubGlobal("document", {
    documentElement: {
      classList,
      offsetHeight: 0,
      style: {
        setProperty: () => {},
        removeProperty: () => {},
      },
    },
  });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 0;
  });
});

describe("ChatMarkdown", () => {
  it("routes completed mermaid fences to the mermaid renderer", async () => {
    const { default: ChatMarkdown } = await import("./ChatMarkdown");
    const markup = renderToStaticMarkup(
      <ChatMarkdown
        text={"```mermaid\nflowchart TD\n  A[Start] --> B[Finish]\n```"}
        cwd={undefined}
        isStreaming={false}
      />,
    );

    expect(markup).toContain('data-testid="mermaid-block"');
    expect(markup).toContain("flowchart TD");
  });

  it("keeps mermaid fences as code while streaming", async () => {
    const { default: ChatMarkdown } = await import("./ChatMarkdown");
    const markup = renderToStaticMarkup(
      <ChatMarkdown
        text={"```mermaid\nflowchart TD\n  A[Start] --> B[Finish]\n```"}
        cwd={undefined}
        isStreaming
      />,
    );

    expect(markup).not.toContain('data-testid="mermaid-block"');
    expect(markup).toContain("<pre");
    expect(markup).toContain("flowchart TD");
  });

  it("keeps normal links and non-mermaid markdown behavior intact", async () => {
    const { default: ChatMarkdown } = await import("./ChatMarkdown");
    const markup = renderToStaticMarkup(
      <ChatMarkdown
        text={"[docs](https://example.com)\n\n```ts\nconst value = 1;\n```"}
        cwd={undefined}
        isStreaming={false}
      />,
    );

    expect(markup).toContain('href="https://example.com"');
    expect(markup).toContain("const value = 1;");
  });
});
