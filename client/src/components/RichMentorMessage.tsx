import { Streamdown, defaultRehypePlugins } from "streamdown";
import { safeHttpUrl } from "@shared/safe-url";

// Preserve Markdown/math, but never turn student/provider HTML into DOM nodes.
const safePlugins = Object.entries(defaultRehypePlugins)
  .filter(([name]) => name !== "raw").map(([, plugin]) => plugin);

export default function RichMentorMessage({ content }: { content: string }) {
  return <div className="prose prose-sm max-w-none dark:prose-invert"><Streamdown
    skipHtml rehypePlugins={safePlugins} mermaidConfig={{ securityLevel: "strict" }}
    components={{
      // A remote image can transmit private context without any student action.
      img: ({ alt }) => <span className="text-muted-foreground">{alt ? `[Image: ${alt}]` : "[Image omitted]"}</span>,
      a: ({ href, children }) => {
        const safe = safeHttpUrl(href);
        return safe ? <a href={safe} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">{children}</a> : <span>{children}</span>;
      },
    }}
  >{content}</Streamdown></div>;
}
