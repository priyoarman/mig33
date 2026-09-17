"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { getActiveComposerToken, type ComposerToken } from "@/lib/entities";
import type { UserProfile } from "@/types";

type HashtagSuggestion = {
  tag: string;
  count: number;
};

type Suggestion = HashtagSuggestion | UserProfile;

function suggestionReplacement(item: Suggestion): string {
  return "tag" in item ? `#${item.tag}` : `@${item.username}`;
}

type ComposerTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  disabled?: boolean;
};

export default function ComposerTextarea({
  value,
  onChange,
  placeholder,
  className,
  rows,
  disabled,
}: ComposerTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [token, setToken] = useState<ComposerToken | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!token) {
      setSuggestions([]);
      return;
    }
    if (token.trigger === "@" && !token.query) {
      setSuggestions([]);
      return;
    }

    const id = setTimeout(async () => {
      try {
        const endpoint =
          token.trigger === "#"
            ? `/api/hashtags/suggest?q=${encodeURIComponent(token.query)}&limit=6`
            : `/api/search/users?q=${encodeURIComponent(token.query)}&limit=6`;
        const res = await fetch(endpoint);
        if (!res.ok) {
          setSuggestions([]);
          return;
        }
        const data = (await res.json()) as {
          hashtags?: HashtagSuggestion[];
          users?: UserProfile[];
        };
        setSuggestions(
          token.trigger === "#" ? data.hashtags || [] : data.users || [],
        );
        setActiveIndex(0);
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(id);
  }, [token]);

  const insertSuggestion = (replacement: string, activeToken: ComposerToken) => {
    const before = value.slice(0, activeToken.start);
    const after = value.slice(activeToken.end);
    const next = `${before}${replacement} ${after}`;
    onChange(next);
    setToken(null);
    setSuggestions([]);

    requestAnimationFrame(() => {
      const node = textareaRef.current;
      if (!node) return;
      const cursor = before.length + replacement.length + 1;
      node.focus();
      node.setSelectionRange(cursor, cursor);
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setToken(getActiveComposerToken(newValue, e.target.selectionStart ?? newValue.length));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!token || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      const selected = suggestions[activeIndex];
      if (!selected) return;
      e.preventDefault();
      insertSuggestion(suggestionReplacement(selected), token);
    } else if (e.key === "Escape") {
      setToken(null);
      setSuggestions([]);
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setToken(null), 150)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={className}
      />

      {token && suggestions.length > 0 && (
        <div className="border-default bg-panel absolute top-full right-0 left-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-2xl border shadow-lg">
          {suggestions.map((item, index) => (
            <button
              key={"tag" in item ? item.tag : item._id ?? item.username}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertSuggestion(suggestionReplacement(item), token)}
              className={`hover-panel flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-left text-sm ${
                index === activeIndex ? "bg-[rgba(15,20,25,0.05)]" : ""
              }`}
            >
              {"tag" in item ? (
                <>
                  <span className="font-semibold text-cyan-600">
                    #{item.tag}
                  </span>
                  <span className="text-muted text-xs">
                    {item.count} {item.count === 1 ? "post" : "posts"}
                  </span>
                </>
              ) : (
                <>
                  <span className="avatar-square h-8 w-8 shrink-0 overflow-hidden rounded-full bg-neutral-300">
                    {item.profileImage ? (
                      <Image
                        src={item.profileImage}
                        alt=""
                        width={32}
                        height={32}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xs font-bold">
                        {item.name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-primary block truncate font-semibold">
                      {item.name}
                    </span>
                    <span className="text-muted block truncate text-xs">
                      @{item.username}
                    </span>
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
