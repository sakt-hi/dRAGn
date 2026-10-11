"use client";

import { useEffect, useState } from "react";

type InlinePart = string | { type: "code" | "strong" | "em" | "link"; value: string; href?: string };

function inlineParts(value: string): InlinePart[] {
  const parts: InlinePart[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let cursor = 0;
  for (const match of value.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) parts.push(value.slice(cursor, index));
    const token = match[0];
    if (token.startsWith("`")) parts.push({ type: "code", value: token.slice(1, -1) });
    else if (token.startsWith("**")) parts.push({ type: "strong", value: token.slice(2, -2) });
    else if (token.startsWith("*")) parts.push({ type: "em", value: token.slice(1, -1) });
    else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) parts.push({ type: "link", value: link[1], href: link[2] });
    }
    cursor = index + token.length;
  }
  if (cursor < value.length) parts.push(value.slice(cursor));
  return parts;
}

function InlineText({ value }: { value: string }) {
  return <>{inlineParts(value).map((part, index) => {
    if (typeof part === "string") return <span key={index}>{part}</span>;
    if (part.type === "code") return <code key={index} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-violet-800">{part.value}</code>;
    if (part.type === "strong") return <strong key={index} className="font-semibold text-slate-900">{part.value}</strong>;
    if (part.type === "em") return <em key={index}>{part.value}</em>;
    let safeHref: string | undefined;
    try {
      const parsed = new URL(part.href ?? "", "https://preview.invalid");
      if (["http:", "https:", "mailto:"].includes(parsed.protocol)) safeHref = part.href;
    } catch { /* Leave unsafe or malformed links as plain text. */ }
    return safeHref ? <a key={index} href={safeHref} target="_blank" rel="noreferrer" className="font-medium text-violet-700 underline decoration-violet-300 underline-offset-2 hover:text-violet-900">{part.value}</a> : <span key={index}>{part.value}</span>;
  })}</>;
}

function tableCells(line: string) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

function MarkdownContent({ source }: { source: string }) {
  const lines = source.replaceAll("\r\n", "\n").split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }
    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) code.push(lines[i++]);
      i++;
      blocks.push(<pre key={i} className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm leading-6 text-slate-100"><code data-language={language || undefined}>{code.join("\n")}</code></pre>);
      continue;
    }
    if (/^---+$/.test(line) || /^\*\*\*$/.test(line)) { blocks.push(<hr key={i++} className="border-slate-200" />); continue; }
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*$/);
    if (heading) {
      const level = heading[1].length;
      const className = level === 1 ? "text-3xl font-bold tracking-tight text-slate-950" : level === 2 ? "text-2xl font-semibold tracking-tight text-slate-950" : "text-lg font-semibold text-slate-900";
      blocks.push(<div key={i++} className={className}><InlineText value={heading[2]} /></div>);
      continue;
    }
    if (line.startsWith("|") && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
      const headers = tableCells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) rows.push(tableCells(lines[i++]));
      blocks.push(<div key={i} className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[32rem] border-collapse text-left text-sm"><thead className="bg-slate-50"><tr>{headers.map((cell, index) => <th key={index} className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-800"><InlineText value={cell} /></th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex} className="even:bg-slate-50/70">{headers.map((_, index) => <td key={index} className="border-b border-slate-100 px-4 py-3 text-slate-700"><InlineText value={row[index] ?? ""} /></td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    if (/^[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*+]\s+/, ""));
      blocks.push(<ul key={i} className="list-disc space-y-2 pl-6 marker:text-violet-500">{items.map((item, index) => <li key={index} className="pl-1"><InlineText value={item} /></li>)}</ul>);
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+\.\s+/, ""));
      blocks.push(<ol key={i} className="list-decimal space-y-2 pl-6 marker:font-medium marker:text-violet-700">{items.map((item, index) => <li key={index} className="pl-1"><InlineText value={item} /></li>)}</ol>);
      continue;
    }
    if (line.startsWith("> ")) { blocks.push(<blockquote key={i++} className="border-l-2 border-violet-300 pl-4 text-slate-600"><InlineText value={line.slice(2)} /></blockquote>); continue; }
    const paragraph = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|```|[-*+]\s|\d+\.\s|>\s|\|)/.test(lines[i].trim()) && !/^---+$/.test(lines[i].trim())) paragraph.push(lines[i++].trim());
    blocks.push(<p key={i} className="leading-7 text-slate-700"><InlineText value={paragraph.join(" ")} /></p>);
  }

  return <article className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-5 py-8 text-[15px] sm:px-10 sm:py-10 sm:text-base">{blocks}</article>;
}

export function MarkdownPreview({ url, title }: { url: string; title: string }) {
  const [source, setSource] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load Markdown document");
        return response.text();
      })
      .then(setSource)
      .catch((fetchError: unknown) => {
        if (fetchError instanceof Error && fetchError.name !== "AbortError") setError(true);
      });
    return () => controller.abort();
  }, [url]);

  if (error) return <div className="m-5 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Could not load this Markdown preview.</div>;
  if (source === null) return <div role="status" className="p-6 text-sm text-slate-500">Loading {title}…</div>;
  return <div className="h-full overflow-y-auto bg-white"><MarkdownContent source={source} /></div>;
}
