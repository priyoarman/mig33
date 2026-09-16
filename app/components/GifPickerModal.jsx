"use client";

import { useEffect, useRef, useState } from "react";
import { MdOutlineGifBox } from "react-icons/md";

export default function GifPickerModal({ isOpen, onClose, onSelect }) {
  const [gifSearchQuery, setGifSearchQuery] = useState("");
  const [gifResults, setGifResults] = useState([]);
  const [isGifSearching, setIsGifSearching] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!gifSearchQuery.trim()) {
      setGifResults([]);
      return;
    }
    const id = setTimeout(async () => {
      setIsGifSearching(true);
      try {
        const res = await fetch(
          `/api/tenor/search?q=${encodeURIComponent(gifSearchQuery)}&limit=30`
        );
        const data = await res.json();
        setGifResults(data.results || []);
      } catch (err) {
        console.error("Giphy search error:", err);
      } finally {
        setIsGifSearching(false);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [gifSearchQuery, isOpen]);

  if (!isOpen) return null;

  const handleSelect = (gifUrl, previewUrl) => {
    onSelect(gifUrl, previewUrl);
    setGifSearchQuery("");
    setGifResults([]);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/10 px-4 pt-16 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        className="border-default bg-panel w-full max-w-[560px] overflow-hidden rounded-[22px] border shadow-[0_20px_50px_rgba(15,23,42,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-default bg-surface flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-600">
              <MdOutlineGifBox className="text-lg" />
            </div>
            <h2 className="text-primary text-sm font-semibold">Search GIFs</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hover-panel text-muted hover:text-primary flex h-8 w-8 items-center justify-center rounded-full text-xl transition"
          >
            &times;
          </button>
        </div>

        <div className="p-3">
          <div className="border-default bg-surface flex items-center gap-2 rounded-xl border px-3 py-2">
            <svg
              viewBox="0 0 24 24"
              className="text-muted h-4 w-4 fill-none stroke-current"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="6" />
              <path d="M16 16L21 21" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={gifSearchQuery}
              onChange={(e) => setGifSearchQuery(e.target.value)}
              placeholder="Search Giphy GIFs..."
              className="text-primary w-full border-0 bg-transparent text-base outline-none placeholder:text-[color:var(--muted)] sm:text-sm"
            />
          </div>
        </div>

        <div className="max-h-[58vh] overflow-y-auto px-3 pb-3">
          {isGifSearching ? (
            <div className="flex h-36 items-center justify-center">
              <p className="text-muted text-sm">Searching...</p>
            </div>
          ) : gifResults.length === 0 ? (
            <div className="flex h-36 items-center justify-center">
              <p className="text-muted text-sm">
                {gifSearchQuery ? "No GIFs found" : "Search for GIFs to get started"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {gifResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(item.url, item.preview)}
                  className="border-default bg-surface group relative overflow-hidden rounded-xl border transition hover:opacity-90"
                >
                  <img src={item.preview} alt={`gif-${idx}`} className="h-28 w-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
