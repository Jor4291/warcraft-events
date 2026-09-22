import type { EventCopyBlock, EventCopyInline } from "@/lib/event-copy";
import { parseEventCopy, safeHref } from "@/lib/event-copy";
import type { ReactNode } from "react";

function InlineCopy({ nodes }: { nodes: EventCopyInline[] }) {
  return nodes.map((node, index) => inlineNode(node, index));
}

function inlineNode(node: EventCopyInline, key: number): ReactNode {
  if (node.type === "text") {
    return node.value;
  }
  if (node.type === "br") {
    return <br key={key} />;
  }
  if (node.type === "strong") {
    return (
      <strong key={key} className="font-semibold text-[var(--gold-bright)]">
        <InlineCopy nodes={node.children} />
      </strong>
    );
  }
  if (node.type === "em") {
    return (
      <em key={key}>
        <InlineCopy nodes={node.children} />
      </em>
    );
  }
  if (node.type === "code") {
    return (
      <code key={key} className="rounded-sm bg-[rgba(230,195,106,0.12)] px-1.5 py-0.5 text-[var(--gold)]">
        {node.value}
      </code>
    );
  }
  const href = safeHref(node.href);
  if (!href) {
    return <InlineCopy key={key} nodes={node.children} />;
  }
  return (
    <a key={key} href={href} target="_blank" rel="noreferrer">
      <InlineCopy nodes={node.children} />
    </a>
  );
}

function BlockCopy({ block }: { block: EventCopyBlock }) {
  if (block.type === "heading") {
    const className =
      block.level === 2
        ? "tavern-title text-2xl text-[var(--gold)]"
        : block.level === 3
          ? "tavern-title text-xl text-[var(--gold)]"
          : "text-lg font-semibold text-[var(--gold-bright)]";
    const Tag = block.level === 2 ? "h2" : block.level === 3 ? "h3" : "h4";
    return (
      <Tag className={className}>
        <InlineCopy nodes={block.children} />
      </Tag>
    );
  }
  if (block.type === "quote") {
    return (
      <blockquote className="border-l-2 border-[var(--gold)] bg-[rgba(230,195,106,0.08)] px-4 py-3">
        <InlineCopy nodes={block.children} />
      </blockquote>
    );
  }
  if (block.type === "list") {
    const Tag = block.ordered ? "ol" : "ul";
    return (
      <Tag className={`${block.ordered ? "list-decimal" : "list-disc"} space-y-1 pl-5`}>
        {block.items.map((item, index) => (
          <li key={index}>
            <InlineCopy nodes={item} />
          </li>
        ))}
      </Tag>
    );
  }
  return (
    <p>
      <InlineCopy nodes={block.children} />
    </p>
  );
}

export function EventCopy({ source, className = "" }: { source: string; className?: string }) {
  const blocks = parseEventCopy(source);
  if (!blocks.length) {
    return null;
  }
  return (
    <div className={`space-y-3 text-[var(--muted)] ${className}`.trim()}>
      {blocks.map((block, index) => (
        <BlockCopy key={index} block={block} />
      ))}
    </div>
  );
}
