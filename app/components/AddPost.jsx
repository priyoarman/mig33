"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PiImageSquareBold } from "react-icons/pi";
import { MdOutlineGifBox } from "react-icons/md";
import { HiMiniListBullet } from "react-icons/hi2";

export default function AddPost() {
  const { data: session, status } = useSession();
  const [body, setBody] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gifModalOpen, setGifModalOpen] = useState(false);
  const [gifSearchQuery, setGifSearchQuery] = useState("");
  const [gifResults, setGifResults] = useState([]);
  const [isGifSearching, setIsGifSearching] = useState(false);
  const [selectedGifUrl, setSelectedGifUrl] = useState(null);
  const router = useRouter();

  // Ensure hooks are declared in the same order on every render
  const searchInputRef = useRef(null);
  useEffect(() => {
    if (gifModalOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [gifModalOpen]);

  useEffect(() => {
    if (!gifModalOpen) return;
    if (!gifSearchQuery.trim()) {
      setGifResults([]);
      return;
    }
    const id = setTimeout(async () => {
      setIsGifSearching(true);
      try {
        const res = await fetch(
          `/api/tenor/search?q=${encodeURIComponent(gifSearchQuery)}&limit=30`,
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
  }, [gifSearchQuery, gifModalOpen]);

  if (status === "loading") return null;
  if (!session) {
    return (
      <p className="text-primary mx-2 my-2 mb-8 flex h-34 items-center justify-center gap-1.5 px-4 py-4 text-center font-semibold">
        Please{" "}
        <a href="/login" className="text-blue-400">
          LOGIN
        </a>{" "}
        to post.
      </p>
    );
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setSelectedGifUrl(null); // Clear GIF if image is selected
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    setSelectedGifUrl(null);
  };

  // Search Giphy GIFs (kept for explicit/manual triggering if needed)
  const searchGifs = async () => {
    if (!gifSearchQuery.trim()) return;

    setIsGifSearching(true);
    try {
      const res = await fetch(
        `/api/tenor/search?q=${encodeURIComponent(gifSearchQuery)}&limit=30`,
      );
      const data = await res.json();
      setGifResults(data.results || []);
    } catch (err) {
      console.error("Giphy search error:", err);
      alert("Failed to search GIFs");
    } finally {
      setIsGifSearching(false);
    }
  };

  // Select a GIF and set it as preview
  const selectGif = (gifUrl, previewUrl) => {
    setSelectedGifUrl(gifUrl);
    setImagePreview(previewUrl || gifUrl);
    setImage(null); // Clear file upload if GIF is selected
    setGifModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!body.trim() && !image && !selectedGifUrl) {
      alert("Write something to be seen!");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("body", body);

    if (image) {
      formData.append("image", image);
    }

    if (selectedGifUrl) {
      formData.append("gifUrl", selectedGifUrl);
    }

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setBody("");
        setImage(null);
        setImagePreview(null);
        setSelectedGifUrl(null);
        router.refresh();
      } else {
        throw new Error("Failed to create a post");
      }
    } catch (err) {
      console.error(err);
      alert("Error posting");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="border-default z-20 flex flex-col justify-around border-b-1"
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="border-default bg-panel h-24 resize-none border-b-1 px-4 py-4 outline-0 placeholder:font-medium"
          placeholder="What's happening?"
        />
        {imagePreview && (
          <div className="relative mx-4 my-2">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-h-60 w-auto rounded-md"
            />
            <button
              type="button"
              onClick={removeImage}
              className="bg-opacity-50 absolute top-2 right-2 rounded-full bg-black px-3 py-0.5 pb-1 font-bold text-white"
            >
              &times;
            </button>
          </div>
        )}
        <div className="bg-panel flex flex-row items-center justify-between gap-2">
          <input
            type="file"
            id="imageUpload"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <div className="flex flex-row">
            <div className="pl-6 text-2xl text-cyan-500">
              <label htmlFor="imageUpload">
                <PiImageSquareBold className="hover:text-muted cursor-pointer" />
              </label>
            </div>
            <div className="pl-6 text-2xl text-cyan-500">
              <button
                type="button"
                onClick={() => setGifModalOpen(true)}
                className="m-0 cursor-pointer border-none bg-none p-0"
              >
                <MdOutlineGifBox className="hover:text-muted cursor-pointer" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mx-2 my-2 h-10 cursor-pointer rounded-3xl bg-gray-900 px-4 text-sm font-bold text-white hover:bg-cyan-500 disabled:opacity-50"
          >
            {isSubmitting ? "Posting..." : "Post"}
          </button>
        </div>
      </form>

      {/* GIF Search Modal */}
      {gifModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/10 px-4 pt-16 backdrop-blur-[1px]">
          <div className="w-full max-w-[560px] overflow-hidden rounded-[22px] border border-neutral-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] dark:border-neutral-700 dark:bg-neutral-950">
            <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-600">
                  <MdOutlineGifBox className="text-lg" />
                </div>
                <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                  Search GIFs
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setGifModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              >
                &times;
              </button>
            </div>

            <div className="p-3">
              <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-100 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 fill-none stroke-current text-neutral-500"
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
                  className="w-full border-0 bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-500 dark:text-neutral-100"
                />
              </div>
            </div>

            <div className="max-h-[58vh] overflow-y-auto px-3 pb-3">
              {isGifSearching ? (
                <div className="flex h-36 items-center justify-center">
                  <p className="text-sm text-neutral-500">Searching...</p>
                </div>
              ) : gifResults.length === 0 ? (
                <div className="flex h-36 items-center justify-center">
                  <p className="text-sm text-neutral-500">
                    {gifSearchQuery
                      ? "No GIFs found"
                      : "Search for GIFs to get started"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {gifResults.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectGif(item.url, item.preview)}
                      className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 transition hover:opacity-90 dark:border-neutral-700 dark:bg-neutral-900"
                    >
                      <img
                        src={item.preview}
                        alt={`gif-${idx}`}
                        className="h-28 w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
