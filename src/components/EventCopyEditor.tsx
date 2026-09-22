"use client";

import { useRef, useState } from "react";
import { EventCopy } from "@/components/EventCopy";

export function EventCopyEditor({
  name,
  defaultValue = "",
  rows = 8,
}: {
  name: string;
  defaultValue?: string;
  rows?: number;
}) {
  const [value, setValue] = useState(defaultValue);
  const [preview, setPreview] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);

  function surround(before: string, after = before, placeholder = "text") {
    const field = area.current;
    if (!field) {
      return;
    }
    const start = field.selectionStart;
    const end = field.selectionEnd;
    const selected = value.slice(start, end) || placeholder;
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    setValue(next);
    requestAnimationFrame(() => {
      field.focus();
      const inner = start + before.length;
      field.setSelectionRange(inner, inner + selected.length);
    });
  }

  function toggleLinePrefix(prefix: string) {
    const field = area.current;
    if (!field) {
      return;
    }
    const start = field.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = value.indexOf("\n", start);
    const end = lineEnd === -1 ? value.length : lineEnd;
    const line = value.slice(lineStart, end);
    const stripped = line.replace(/^(#{1,3}\s+|[-*]\s+|>\s?|\d+\.\s+)/, "");
    const already = line.startsWith(prefix);
    const nextLine = already ? stripped : `${prefix}${stripped}`;
    const next = `${value.slice(0, lineStart)}${nextLine}${value.slice(end)}`;
    setValue(next);
    requestAnimationFrame(() => {
      field.focus();
      const cursor = lineStart + nextLine.length;
      field.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <MarkButton label="Bold" onClick={() => surround("**")}>
          B
        </MarkButton>
        <MarkButton label="Italic" onClick={() => surround("*")}>
          <span className="italic">I</span>
        </MarkButton>
        <MarkButton label="Heading" onClick={() => toggleLinePrefix("## ")}>
          H
        </MarkButton>
        <MarkButton label="List" onClick={() => toggleLinePrefix("- ")}>
          List
        </MarkButton>
        <MarkButton label="Note" onClick={() => toggleLinePrefix("> ")}>
          Note
        </MarkButton>
        <MarkButton label="Link" onClick={() => surround("[", "](https://)")}>
          Link
        </MarkButton>
        <MarkButton label={preview ? "Edit write-up" : "Preview"} onClick={() => setPreview((open) => !open)}>
          {preview ? "Edit" : "Preview"}
        </MarkButton>
      </div>
      {preview ? (
        <div className="tavern-frame min-h-40 p-4">
          {value.trim() ? <EventCopy source={value} /> : <p className="text-sm text-[var(--muted)]">Nothing to preview yet.</p>}
        </div>
      ) : (
        <textarea
          ref={area}
          name={name}
          rows={rows}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="tavern-input"
          placeholder={"## Rules\n**Alliance only.** Bring your *best* set.\n\n- Best of 3\n- No reputation gear"}
        />
      )}
      {preview ? <input type="hidden" name={name} value={value} /> : null}
      <p className="text-xs text-[var(--muted)]">
        Headings, bold, italic, lists, notes, and links. Preview the attendee page before you hang it.
      </p>
    </div>
  );
}

function MarkButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className="tavern-btn-ghost px-2 py-1 text-sm" aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}
