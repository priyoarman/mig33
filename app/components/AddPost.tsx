"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PiImageSquareBold } from "react-icons/pi";
import { MdOutlineGifBox } from "react-icons/md";
import ComposerTextarea from "./ComposerTextarea";
import GifPickerModal from "./GifPickerModal";

export default function AddPost() {
  const { data: session, status } = useSession();
  const [body, setBody] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gifModalOpen, setGifModalOpen] = useState(false);
  const [selectedGifUrl, setSelectedGifUrl] = useState<string | null>(null);
  const router = useRouter();

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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

  // Select a GIF and set it as preview
  const selectGif = (gifUrl: string, previewUrl?: string) => {
    setSelectedGifUrl(gifUrl);
    setImagePreview(previewUrl || gifUrl);
    setImage(null); // Clear file upload if GIF is selected
    setGifModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
        <ComposerTextarea
          value={body}
          onChange={setBody}
          className="border-default bg-panel h-24 w-full resize-none border-b-1 px-4 py-4 outline-0 placeholder:font-medium"
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
              className="bg-opacity-50 absolute top-2 right-2 cursor-pointer rounded-full bg-black px-3 py-0.5 pb-1 font-bold text-white"
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

      <GifPickerModal
        isOpen={gifModalOpen}
        onClose={() => setGifModalOpen(false)}
        onSelect={selectGif}
      />
    </>
  );
}
