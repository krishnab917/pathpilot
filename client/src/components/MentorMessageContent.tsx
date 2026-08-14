import { Fragment, lazy, Suspense, type ReactNode } from "react";

const RichMentorMessage = lazy(() => import("./RichMentorMessage"));

export function needsRichMentorRenderer(content: string) {
  return /```|!\[[^\]]*\]\([^)]*\)|\[[^\]]+\]\([^)]*\)|^\|.*\|/m.test(content);
}

function InlineText({ text }: { text: string }) {
  const segments = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return <>{segments.map((segment, index) => {
    if (segment.startsWith("**") && segment.endsWith("**")) return <strong key={index}>{segment.slice(2, -2)}</strong>;
    if (segment.startsWith("`") && segment.endsWith("`")) return <code key={index} className="bg-slate-200 px-1 py-0.5 font-mono text-[0.85em] dark:bg-slate-700">{segment.slice(1, -1)}</code>;
    return <Fragment key={index}>{segment}</Fragment>;
  })}</>;
}

function PlainMentorMessage({ content }: { content: string }) {
  const blocks = content.trim().split(/\n{2,}/).filter(Boolean);
  return <div className="space-y-2 text-sm leading-6">{blocks.map((block, blockIndex) => {
    const lines = block.split("\n");
    const bulletLines = lines.every(line => /^[-*]\s+/.test(line));
    const numberedLines = lines.every(line => /^\d+\.\s+/.test(line));
    const quoteLines = lines.every(line => /^>\s?/.test(line));
    const renderLines = (values: string[]): ReactNode => values.map((line, lineIndex) => <Fragment key={lineIndex}><InlineText text={line} />{lineIndex < values.length - 1 ? <br /> : null}</Fragment>);
    if (bulletLines) return <ul key={blockIndex} className="list-disc space-y-1 pl-5">{lines.map((line, lineIndex) => <li key={lineIndex}><InlineText text={line.replace(/^[-*]\s+/, "")} /></li>)}</ul>;
    if (numberedLines) return <ol key={blockIndex} className="list-decimal space-y-1 pl-5">{lines.map((line, lineIndex) => <li key={lineIndex}><InlineText text={line.replace(/^\d+\.\s+/, "")} /></li>)}</ol>;
    if (quoteLines) return <blockquote key={blockIndex} className="border-l-2 border-slate-300 pl-3 text-muted-foreground dark:border-slate-600">{renderLines(lines.map(line => line.replace(/^>\s?/, "")))}</blockquote>;
    return <p key={blockIndex}>{renderLines(lines)}</p>;
  })}</div>;
}

export function MentorMessageContent({ content }: { content: string }) {
  if (!needsRichMentorRenderer(content)) return <PlainMentorMessage content={content} />;
  return <Suspense fallback={<PlainMentorMessage content={content} />}><RichMentorMessage content={content} /></Suspense>;
}
