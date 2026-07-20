// Renders product descriptions with clickable links.
// Supports two ways of adding a link in the admin panel:
//   1. Markdown style with a custom label:  [شاهد الفيديو](https://example.com)
//   2. A bare URL pasted directly in the text: https://example.com
// Both open in a new tab on click — the visitor never needs to copy anything.

const MD_LINK = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const BARE_URL = /(https?:\/\/[^\s<]+)/g;

type Piece = { text: string; url?: string };

function parse(text: string): Piece[] {
  const pieces: Piece[] = [];
  let lastIndex = 0;
  const combined = new RegExp(`${MD_LINK.source}|${BARE_URL.source}`, "g");
  let m: RegExpExecArray | null;
  while ((m = combined.exec(text))) {
    if (m.index > lastIndex) pieces.push({ text: text.slice(lastIndex, m.index) });
    if (m[1] && m[2]) {
      pieces.push({ text: m[1], url: m[2] }); // markdown link
    } else if (m[3]) {
      pieces.push({ text: m[3], url: m[3] }); // bare url
    }
    lastIndex = combined.lastIndex;
  }
  if (lastIndex < text.length) pieces.push({ text: text.slice(lastIndex) });
  return pieces;
}

export function RichDescription({ text, className }: { text: string; className?: string }) {
  const pieces = parse(text || "");
  return (
    <p className={className} style={{ whiteSpace: "pre-wrap" }}>
      {pieces.map((p, i) =>
        p.url ? (
          <a
            key={i}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:opacity-80"
            onClick={(e) => e.stopPropagation()}
          >
            {p.text}
          </a>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </p>
  );
}
