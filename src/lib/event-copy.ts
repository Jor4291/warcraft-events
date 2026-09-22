export type EventCopyInline =
  | { type: "text"; value: string }
  | { type: "br" }
  | { type: "strong"; children: EventCopyInline[] }
  | { type: "em"; children: EventCopyInline[] }
  | { type: "code"; value: string }
  | { type: "link"; href: string; children: EventCopyInline[] };

export type EventCopyBlock =
  | { type: "heading"; level: 2 | 3 | 4; children: EventCopyInline[] }
  | { type: "paragraph"; children: EventCopyInline[] }
  | { type: "quote"; children: EventCopyInline[] }
  | { type: "list"; ordered: boolean; items: EventCopyInline[][] };

const INLINE =
  /\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|__(.+?)__|\*(.+?)\*|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|(https?:\/\/[^\s<>)]+)/g;

export function safeHref(href: string) {
  try {
    const url = new URL(href);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.href;
    }
  } catch {
    return "";
  }
  return "";
}

export function parseInline(text: string): EventCopyInline[] {
  const nodes: EventCopyInline[] = [];
  let last = 0;
  const pattern = new RegExp(INLINE.source, "g");
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > last) {
      nodes.push({ type: "text", value: text.slice(last, match.index) });
    }
    if (match[1]) {
      nodes.push({ type: "strong", children: [{ type: "em", children: parseInline(match[1]) }] });
    } else if (match[2] || match[3]) {
      nodes.push({ type: "strong", children: parseInline(match[2] || match[3]) });
    } else if (match[4]) {
      nodes.push({ type: "em", children: parseInline(match[4]) });
    } else if (match[5]) {
      nodes.push({ type: "code", value: match[5] });
    } else if (match[6] && match[7]) {
      const href = safeHref(match[7]);
      if (href) {
        nodes.push({ type: "link", href, children: parseInline(match[6]) });
      } else {
        nodes.push({ type: "text", value: match[0] });
      }
    } else if (match[8]) {
      const raw = match[8].replace(/[.,;:!?]+$/, "");
      const href = safeHref(raw);
      const extra = match[8].slice(raw.length);
      if (href) {
        nodes.push({ type: "link", href, children: [{ type: "text", value: raw }] });
        if (extra) {
          nodes.push({ type: "text", value: extra });
        }
      } else {
        nodes.push({ type: "text", value: match[0] });
      }
    }
    last = pattern.lastIndex;
  }
  if (last < text.length) {
    nodes.push({ type: "text", value: text.slice(last) });
  }
  return nodes;
}

function headingLevel(line: string): 2 | 3 | 4 | null {
  const match = /^(#{1,3})\s+(.*)$/.exec(line);
  if (!match) {
    return null;
  }
  const hashes = match[1].length;
  return hashes === 1 ? 2 : hashes === 2 ? 3 : 4;
}

function headingText(line: string) {
  return line.replace(/^#{1,3}\s+/, "");
}

function listItem(line: string) {
  const unordered = /^[-*]\s+(.*)$/.exec(line);
  if (unordered) {
    return { ordered: false, text: unordered[1] };
  }
  const ordered = /^\d+\.\s+(.*)$/.exec(line);
  if (ordered) {
    return { ordered: true, text: ordered[1] };
  }
  return null;
}

function quoteText(line: string) {
  const match = /^>\s?(.*)$/.exec(line);
  return match ? match[1] : null;
}

function joinLines(lines: string[]): EventCopyInline[] {
  return lines.flatMap((line, index) => (index === 0 ? parseInline(line) : [{ type: "br" as const }, ...parseInline(line)]));
}

export function parseEventCopy(source: string): EventCopyBlock[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: EventCopyBlock[] = [];
  let paragraph: string[] = [];
  let quotes: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  function flushParagraph() {
    const kept = paragraph.map((line) => line.trimEnd());
    while (kept.length && !kept[0].trim()) {
      kept.shift();
    }
    while (kept.length && !kept[kept.length - 1].trim()) {
      kept.pop();
    }
    if (kept.length) {
      blocks.push({ type: "paragraph", children: joinLines(kept) });
    }
    paragraph = [];
  }

  function flushQuote() {
    if (quotes.length) {
      blocks.push({ type: "quote", children: joinLines(quotes) });
      quotes = [];
    }
  }

  function flushList() {
    if (list?.items.length) {
      blocks.push({
        type: "list",
        ordered: list.ordered,
        items: list.items.map((item) => parseInline(item)),
      });
    }
    list = null;
  }

  function flushAll() {
    flushParagraph();
    flushQuote();
    flushList();
  }

  for (const line of lines) {
    const heading = headingLevel(line);
    if (heading) {
      flushAll();
      blocks.push({ type: "heading", level: heading, children: parseInline(headingText(line)) });
      continue;
    }
    const quoted = quoteText(line);
    if (quoted !== null) {
      flushParagraph();
      flushList();
      quotes.push(quoted);
      continue;
    }
    const item = listItem(line);
    if (item) {
      flushParagraph();
      flushQuote();
      if (!list || list.ordered !== item.ordered) {
        flushList();
        list = { ordered: item.ordered, items: [] };
      }
      list.items.push(item.text);
      continue;
    }
    if (!line.trim()) {
      flushAll();
      continue;
    }
    flushQuote();
    flushList();
    paragraph.push(line);
  }
  flushAll();
  return blocks;
}

export function stripEventCopy(source: string) {
  return parseEventCopy(source)
    .map((block) => {
      if (block.type === "list") {
        return block.items.map((item) => flattenInline(item)).join(" ");
      }
      return flattenInline(block.children);
    })
    .filter(Boolean)
    .join(" ");
}

export function plainEventCopy(source: string) {
  return parseEventCopy(source)
    .map((block) => {
      if (block.type === "list") {
        return block.items.map((item) => `- ${flattenInline(item, "\n")}`).join("\n");
      }
      return flattenInline(block.children, "\n");
    })
    .filter(Boolean)
    .join("\n\n");
}

function flattenInline(nodes: EventCopyInline[], lineBreak = " "): string {
  return nodes
    .map((node) => {
      if (node.type === "text" || node.type === "code") {
        return node.value;
      }
      if (node.type === "br") {
        return lineBreak;
      }
      return flattenInline(node.children, lineBreak);
    })
    .join("");
}
