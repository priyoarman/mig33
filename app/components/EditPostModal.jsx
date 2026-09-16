"use client";

import { useEffect, useState } from "react";
import { PiImageSquareBold } from "react-icons/pi";
import { MdOutlineGifBox } from "react-icons/md";
import ComposerTextarea from "./ComposerTextarea";
import GifPickerModal from "./GifPickerModal";

export default function EditPostModal({ post, isOpen, onClose, onUpdated }) {
  const [newBody, setNewBody] = useState(post?.body || "");
  const [existingImages, setExistingImages] = useState(post?.images || []);
  const [newImage, setNewImage] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);
  const [selectedGifUrl, setSelectedGifUrl] = useState(null);
  const [gifModalOpen, setGifModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewBody(post?.body || "");
      setExistingImages(post?.images || []);
      setNewImage(null);
      setNewImagePreview(null);
      setSelectedGifUrl(null);
    }
  }, [isOpen, post]);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImage(file);
      setNewImagePreview(URL.createObjectURL(file));
      setSelectedGifUrl(null);
    }
  };

  const removeNewMedia = () => {
    setNewImage(null);
    setNewImagePreview(null);
    setSelectedGifUrl(null);
  };

  const removeExistingImage = (url) => {
    setExistingImages((prev) => prev.filter((image) => image !== url));
  };

  const selectGif = (gifUrl, previewUrl) => {
    setSelectedGifUrl(gifUrl);
    setNewImagePreview(previewUrl || gifUrl);
    setNewImage(null);
    setGifModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !newBody.trim() &&
      existingImages.length === 0 &&
      !newImage &&
      !selectedGifUrl
    ) {
      alert("Write something to be seen!");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("newBody", newBody);
    formData.append("existingImages", JSON.stringify(existingImages));
    if (newImage) formData.append("image", newImage);
    if (selectedGifUrl) formData.append("gifUrl", selectedGifUrl);

    try {
      const res = await fetch(`/api/posts/${post._id}`, {
        method: "PUT",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to update post");
      const data = await res.json();
      onUpdated(data.post);
    } catch (error) {
      console.error(error);
      alert("Failed to update post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]"
        onClick={onClose}
      >
        <div
          className="border-default bg-panel relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="border-default flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-primary text-lg font-semibold">Edit post</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close edit post"
              className="border-default hover-panel text-muted hover:text-primary flex h-8 w-8 items-center justify-center rounded-full border transition"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 fill-current"
                aria-hidden="true"
              >
                <path d="M18.3 5.71a1 1 0 0 0-1.41-1.41L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.89 4.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 1 0 1.41-1.41L13.41 12l4.89-4.89Z" />
              </svg>
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="max-h-[calc(90vh-4.5rem)] overflow-y-auto"
          >
            <ComposerTextarea
              onChange={setNewBody}
              value={newBody}
              className="border-default h-24 w-full resize-none border-b-1 bg-transparent px-4 py-4 outline-none"
              placeholder="What's on your mind?"
            />

            {existingImages.length > 0 && (
              <div className="flex flex-col gap-2 px-4 py-2">
                {existingImages.map((url) => (
                  <div key={url} className="relative">
                    <img
                      src={url}
                      alt="Post media"
                      className="max-h-60 w-auto rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(url)}
                      className="bg-opacity-50 absolute top-2 right-2 rounded-full bg-black px-3 py-0.5 pb-1 font-bold text-white"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}

            {newImagePreview && (
              <div className="relative mx-4 my-2">
                <img
                  src={newImagePreview}
                  alt="New media preview"
                  className="max-h-60 w-auto rounded-md"
                />
                <button
                  type="button"
                  onClick={removeNewMedia}
                  className="bg-opacity-50 absolute top-2 right-2 rounded-full bg-black px-3 py-0.5 pb-1 font-bold text-white"
                >
                  &times;
                </button>
              </div>
            )}

            <div className="border-default flex flex-row items-center justify-between gap-2 border-t px-4 py-2 text-2xl text-cyan-500">
              <input
                type="file"
                id="editImageInput"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <div className="flex flex-row gap-4">
                <label htmlFor="editImageInput">
                  <PiImageSquareBold className="hover:text-muted cursor-pointer" />
                </label>
                <button
                  type="button"
                  onClick={() => setGifModalOpen(true)}
                  className="m-0 cursor-pointer border-none bg-none p-0"
                >
                  <MdOutlineGifBox className="hover:text-muted cursor-pointer" />
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mx-2 my-2 h-10 cursor-pointer rounded-3xl bg-gray-900 px-4 text-sm font-bold text-white hover:bg-cyan-500 disabled:opacity-50"
              >
                {isSubmitting ? "Updating..." : "Update"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <GifPickerModal
        isOpen={gifModalOpen}
        onClose={() => setGifModalOpen(false)}
        onSelect={selectGif}
      />
    </>
  );
}
