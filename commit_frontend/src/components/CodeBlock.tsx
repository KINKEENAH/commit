import { ReactNode } from "react";

type CodeBlockProps = {
  /** Small language tag shown top-right, e.g. "JS", "PYTHON". */
  tag?: string;
  children: ReactNode;
};

// This only provides the frame (dots + tag + monospace body). Each page
// supplies its own syntax-colored spans as children, since the code content
// differs per screen (the landing easter egg vs. the actual confession
// preview vs. the decrypt line) — see the syntax color classes in index.css
// (text-code-keyword, text-code-string, etc.) for how to color a token.
export default function CodeBlock({ tag = "JS", children }: CodeBlockProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-text-muted" />
          <span className="w-2 h-2 rounded-full bg-text-muted" />
          <span className="w-2 h-2 rounded-full bg-text-muted" />
        </div>
        <span className="text-xs font-mono text-text-muted">{tag}</span>
      </div>
      <div className="font-mono text-sm leading-relaxed text-code-plain">{children}</div>
    </div>
  );
}
