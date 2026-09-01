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
          `/api/tenor/search?q=${encodeURIComponent(gifSearchQuery)}&limit=30`
        );
        const data = await res.json();
        setGifResults(data.results || []);
      } catch (err) {
        console.error("Tenor search error:", err);
      } finally {
        setIsGifSearching(false);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [gifSearchQuery, gifModalOpen]);

  if (status === "loading") return null;
  if (!session) {
    return (
      <p className="mx-2 my-2 mb-8 flex h-34 items-center justify-center gap-1.5 px-4 py-4 text-center font-semibold text-primary">
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

  // Search Tenor GIFs (kept for explicit/manual triggering if needed)
  const searchTenorGifs = async () => {
    if (!gifSearchQuery.trim()) return;
    
    setIsGifSearching(true);
    try {
      const res = await fetch(
        `/api/tenor/search?q=${encodeURIComponent(gifSearchQuery)}&limit=30`
      );
      const data = await res.json();
      setGifResults(data.results || []);
    } catch (err) {
      console.error("Tenor search error:", err);
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
        className="z-20 flex flex-col justify-around border-b-1 border-default"
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="h-24 resize-none border-b-1 border-default bg-panel px-4 py-4 outline-0 placeholder:font-medium"
          placeholder="What's happening?"
        />
        {imagePreview && (
          <div className="relative my-2 mx-4">
            <img src={imagePreview} alt="Preview" className="rounded-md max-h-60 w-auto" />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full px-3 py-0.5 pb-1 font-bold"
            >
              &times;
            </button>
          </div>
        )}
        <div className="flex flex-row items-center justify-between gap-2 bg-panel">
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
                <PiImageSquareBold className="cursor-pointer hover:text-muted" />
              </label>
            </div>
            <div className="pl-6 text-2xl text-cyan-500">
              <button
                type="button"
                onClick={() => setGifModalOpen(true)}
                className="p-0 m-0 bg-none border-none cursor-pointer"
              >
                <MdOutlineGifBox className="cursor-pointer hover:text-muted" />
              </button>
            </div>
            <div className="pl-6 text-2xl text-cyan-500">
              <input type="file" name="" id="listUpload" hidden />
              <label htmlFor="listUpload">
                <HiMiniListBullet className="cursor-pointer hover:text-muted" />
              </label>
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
        <div className="inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-panel w-full max-w-2xl shadow-lg flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b-1 border-default">
              <h2 className="text-lg font-bold">Search GIFs</h2>
              <button
                type="button"
                onClick={() => setGifModalOpen(false)}
                className="text-muted hover:text-primary text-2xl"
              >
                &times;
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b-1 border-default flex gap-2">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={gifSearchQuery}
                  onChange={(e) => setGifSearchQuery(e.target.value)}
                  placeholder="Search Tenor GIFs..."
                  className="flex-1 border-1 border-default rounded px-3 py-2 outline-none focus:border-cyan-500"
                />
            </div>

            {/* GIF Results Grid */}
            <div className="overflow-y-auto flex-1 p-4">
              {isGifSearching ? (
                <div className="flex justify-center items-center h-40">
                  <p className="text-muted">Searching...</p>
                </div>
              ) : gifResults.length === 0 ? (
                <div className="flex justify-center items-center h-40">
                  <p className="text-muted">
                    {gifSearchQuery ? "No GIFs found" : "Search for GIFs to get started"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {gifResults.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectGif(item.url, item.preview)}
                      className="relative overflow-hidden rounded-lg hover:opacity-75 transition-opacity group"
                    >
                      <img
                        src={item.preview}
                        alt={`gif-${idx}`}
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity" />
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
