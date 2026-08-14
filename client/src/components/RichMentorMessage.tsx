import { Streamdown } from "streamdown";

export default function RichMentorMessage({ content }: { content: string }) {
  return <div className="prose prose-sm max-w-none dark:prose-invert"><Streamdown>{content}</Streamdown></div>;
}
