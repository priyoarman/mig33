import Link from "next/link";

const TOKEN_RE = /(#[a-zA-Z0-9_]{1,50}|@[a-zA-Z0-9_]{1,30})/g;

export default function RichText({ text, mentionUsernames = [], className }) {
  if (!text) return null;

  const validMentions = new Set(mentionUsernames.map((u) => u.toLowerCase()));
  const parts = text.split(TOKEN_RE);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith("#")) {
          const tag = part.slice(1);
          return (
            <Link
              key={index}
              href={`/search?q=${encodeURIComponent(tag)}`}
              className="text-cyan-600 hover:underline"
            >
              {part}
            </Link>
          );
        }

        if (part.startsWith("@")) {
          const handle = part.slice(1);
          if (validMentions.has(handle.toLowerCase())) {
            return (
              <Link
                key={index}
                href={`/profile/${handle}`}
                className="text-cyan-600 hover:underline"
              >
                {part}
              </Link>
            );
          }
        }

        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
