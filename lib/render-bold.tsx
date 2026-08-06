import React from "react"

// Render a lightweight `**bold**` marker as <strong> (everything else stays
// regular weight). Shared bold-markup pattern for admin-managed bilingual text
// (value cards, the values footnote, and the investor paragraph) so a single
// phrase can be emphasised while the field stays a plain editable string.
export function renderBold(text: string): React.ReactNode[] {
  return text.split("**").map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part,
  )
}

// Render admin-entered plain text with its formatting preserved:
//   • a blank line starts a new <p> paragraph (text is never merged into one);
//   • single line breaks inside a paragraph are kept (whitespace-pre-line);
//   • **bold** (any number of fragments per paragraph) → <strong>;
//   • text order is preserved and HTML is escaped (React children), so no raw
//     HTML from the admin panel is ever interpreted.
// `containerClassName` carries layout (max-width, centering, margins, spacing
// between paragraphs); `pClassName` carries the per-paragraph text styling. A
// single-paragraph field renders identically to a plain styled <p>.
export function RichText({
  text,
  pClassName,
  containerClassName,
}: {
  text: string
  pClassName?: string
  containerClassName?: string
}): React.ReactElement {
  const paragraphs = text
    .split(/\n(?:[^\S\n]*\n)+/) // one or more blank lines separate paragraphs
    .filter((p) => p.trim() !== "")
  return (
    <div className={containerClassName}>
      {paragraphs.map((para, i) => (
        <p key={i} className={`${pClassName ?? ""} whitespace-pre-line`.trim()}>
          {renderBold(para)}
        </p>
      ))}
    </div>
  )
}
