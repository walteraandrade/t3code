import { memo, useEffect, useMemo, useState, type ReactElement } from "react";
import { fnv1a32 } from "../lib/diffRendering";
import { MarkdownCodeBlockFrame } from "./MarkdownCodeBlockFrame";

export interface MermaidBlockProps {
  code: string;
  theme: "light" | "dark";
  showSourceToolbar?: boolean;
}

type MermaidModule = typeof import("mermaid");

type MermaidRenderState =
  | { status: "loading" }
  | { status: "ready"; svg: string }
  | { status: "error"; errorMessage: string };

let mermaidModulePromise: Promise<MermaidModule> | null = null;

function loadMermaidModule(): Promise<MermaidModule> {
  if (mermaidModulePromise == null) {
    mermaidModulePromise = import("mermaid");
  }
  return mermaidModulePromise;
}

function normalizeMermaidError(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.trim();
  }
  if (typeof error === "string" && error.trim().length > 0) {
    return error.trim();
  }
  return "Mermaid could not render this diagram.";
}

function renderMermaidFrame(
  content: ReactElement,
  code: string,
  showSourceToolbar: boolean,
): ReactElement {
  if (!showSourceToolbar) {
    return content;
  }
  return <MarkdownCodeBlockFrame code={code}>{content}</MarkdownCodeBlockFrame>;
}

export const MermaidBlock = memo(function MermaidBlock({
  code,
  theme,
  showSourceToolbar = true,
}: MermaidBlockProps) {
  const [renderState, setRenderState] = useState<MermaidRenderState>({ status: "loading" });
  const renderId = useMemo(
    () => `mermaid-${fnv1a32(`${theme}:${code}`).toString(36)}-${code.length}`,
    [code, theme],
  );

  useEffect(() => {
    let cancelled = false;
    setRenderState({ status: "loading" });

    void loadMermaidModule()
      .then(async (mermaidModule) => {
        const mermaid = mermaidModule.default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          suppressErrorRendering: true,
          deterministicIds: true,
          theme: theme === "dark" ? "dark" : "default",
        });
        await mermaid.parse(code);
        const { svg } = await mermaid.render(renderId, code);
        if (cancelled) {
          return;
        }
        setRenderState({ status: "ready", svg });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setRenderState({
          status: "error",
          errorMessage: normalizeMermaidError(error),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [code, renderId, theme]);

  if (renderState.status === "ready") {
    return renderMermaidFrame(
      <div className="chat-markdown-mermaid" data-mermaid-state="ready">
        <div className="chat-markdown-mermaid-frame">
          <div dangerouslySetInnerHTML={{ __html: renderState.svg }} />
        </div>
      </div>,
      code,
      showSourceToolbar,
    );
  }

  if (renderState.status === "error") {
    return (
      <div className="chat-markdown-mermaid" data-mermaid-state="error">
        <div className="chat-markdown-mermaid-error" role="status">
          Mermaid render failed: {renderState.errorMessage}
        </div>
        <MarkdownCodeBlockFrame code={code}>
          <pre>
            <code>{code}</code>
          </pre>
        </MarkdownCodeBlockFrame>
      </div>
    );
  }

  return renderMermaidFrame(
    <div className="chat-markdown-mermaid" data-mermaid-state="loading">
      <div className="chat-markdown-mermaid-frame">
        <p className="chat-markdown-mermaid-status">Rendering diagram...</p>
      </div>
    </div>,
    code,
    showSourceToolbar,
  );
});
