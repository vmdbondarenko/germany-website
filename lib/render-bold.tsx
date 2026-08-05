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
