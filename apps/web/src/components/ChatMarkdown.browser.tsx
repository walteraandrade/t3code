// Production CSS is part of the behavior under test because Mermaid output depends on shared chat styles.
import "../index.css";

import { page } from "vitest/browser";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import ChatMarkdown from "./ChatMarkdown";

async function mountChatMarkdown(props: { text: string; isStreaming?: boolean }) {
  const host = document.createElement("div");
  document.body.append(host);
  const screen = await render(
    <ChatMarkdown
      text={props.text}
      cwd={undefined}
      {...(props.isStreaming === undefined ? {} : { isStreaming: props.isStreaming })}
    />,
    { container: host },
  );

  return {
    host,
    screen,
    cleanup: async () => {
      await screen.unmount();
      host.remove();
    },
  };
}

describe("ChatMarkdown browser", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders a mermaid fence as svg in light mode", async () => {
    const mounted = await mountChatMarkdown({
      text: "```mermaid\nflowchart TD\n  A[Start] --> B[Finish]\n```",
    });

    try {
      await vi.waitFor(() => {
        const svg = mounted.host.querySelector(".chat-markdown-mermaid-frame svg");
        expect(svg).not.toBeNull();
      });
    } finally {
      await mounted.cleanup();
    }
  });

  it("renders a mermaid fence as svg in dark mode", async () => {
    document.documentElement.classList.add("dark");
    const mounted = await mountChatMarkdown({
      text: "```mermaid\nflowchart TD\n  A[Start] --> B[Finish]\n```",
    });

    try {
      await vi.waitFor(() => {
        const frame = mounted.host.querySelector(".chat-markdown-mermaid-frame");
        const svg = mounted.host.querySelector(".chat-markdown-mermaid-frame svg");
        expect(frame).not.toBeNull();
        expect(svg).not.toBeNull();
      });
    } finally {
      document.documentElement.classList.remove("dark");
      await mounted.cleanup();
    }
  });

  it("falls back to source when mermaid parsing fails", async () => {
    const mounted = await mountChatMarkdown({
      text: "```mermaid\nnot a valid mermaid diagram\n```",
    });

    try {
      await vi.waitFor(() => {
        const text = mounted.host.textContent ?? "";
        expect(text).toContain("Mermaid render failed:");
        expect(text).toContain("not a valid mermaid diagram");
      });
    } finally {
      await mounted.cleanup();
    }
  });

  it("keeps mermaid fences as code while streaming and upgrades after completion", async () => {
    const mounted = await mountChatMarkdown({
      text: "```mermaid\nflowchart TD\n  A[Start] --> B[Finish]\n```",
      isStreaming: true,
    });

    try {
      await vi.waitFor(() => {
        expect(mounted.host.querySelector(".chat-markdown-mermaid-frame svg")).toBeNull();
        expect(mounted.host.querySelector("pre")).not.toBeNull();
      });

      await mounted.screen.rerender(
        <ChatMarkdown
          text={"```mermaid\nflowchart TD\n  A[Start] --> B[Finish]\n```"}
          cwd={undefined}
          isStreaming={false}
        />,
      );

      await vi.waitFor(() => {
        expect(mounted.host.querySelector(".chat-markdown-mermaid-frame svg")).not.toBeNull();
      });
    } finally {
      await mounted.cleanup();
    }
  });

  it("preserves ordinary markdown links", async () => {
    const mounted = await mountChatMarkdown({
      text: "[docs](https://example.com)",
    });

    try {
      await vi.waitFor(() => {
        expect(page.getByRole("link", { name: "docs" })).toBeTruthy();
      });
    } finally {
      await mounted.cleanup();
    }
  });
});
