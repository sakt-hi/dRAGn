interface AnswerContentProps {
  answer: string;
}

function renderInlineMarkdown(text: string) {
  const tokenPattern = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*]+\*)/g;

  return text.split(tokenPattern).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} className="font-semibold text-slate-800">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("__") && part.endsWith("__")) {
      return <strong key={index} className="font-semibold text-slate-800">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-indigo-800">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

export function AnswerContent({ answer }: AnswerContentProps) {
  const blocks: Array<
    | { type: "paragraph"; text: string }
    | { type: "heading"; text: string }
    | { type: "list"; ordered: boolean; items: string[] }
  > = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  function flushParagraph() {
    if (paragraph.length) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ") });
      paragraph = [];
    }
  }

  function flushList() {
    if (list) {
      blocks.push({ type: "list", ordered: list.ordered, items: list.items });
      list = null;
    }
  }

  const answerWithoutInlineCitationMarkers = answer
    .replace(/\[(?:\d+)\]/g, "")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/ {2,}/g, " ");

  for (const line of answerWithoutInlineCitationMarkers.replace(/\r\n/g, "\n").split("\n")) {
    const trimmed = line.trim();
    const itemMatch = trimmed.match(/^(?:([-*+])|(\d+)\.)\s+(.+)$/);

    if (itemMatch) {
      flushParagraph();
      const ordered = Boolean(itemMatch[2]);
      if (list && list.ordered !== ordered) flushList();
      if (!list) list = { ordered, items: [] };
      list.items.push(itemMatch[3]);
      continue;
    }

    flushList();
    if (!trimmed) {
      flushParagraph();
      continue;
    }

    const headingMatch = trimmed.match(/^#{1,3}\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      blocks.push({ type: "heading", text: headingMatch[1] });
    } else {
      paragraph.push(trimmed);
    }
  }
  flushParagraph();
  flushList();

  return (
    <div className="space-y-3 text-[14px] leading-7 tracking-[-0.005em] text-slate-700 sm:text-[15px]">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return <h3 key={index} className="pt-1 font-semibold tracking-[-0.02em] text-slate-900">{renderInlineMarkdown(block.text)}</h3>;
        }
        if (block.type === "list") {
          const List = block.ordered ? "ol" : "ul";
          return (
            <List key={index} className={`space-y-1.5 pl-6 marker:text-indigo-500 ${block.ordered ? "list-decimal" : "list-disc"}`}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="pl-1">{renderInlineMarkdown(item)}</li>
              ))}
            </List>
          );
        }
        return <p key={index}>{renderInlineMarkdown(block.text)}</p>;
      })}
    </div>
  );
}
