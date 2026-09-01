"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PiImageSquareBold } from "react-icons/pi";

const EditPostPage = ({ id, body }) => {
  const [newBody, setNewBody] = useState(body);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (image) {
        const formData = new FormData();
        formData.append("newBody", newBody);
        formData.append("image", image);
        res = await fetch(`/api/posts/${id}`, {
          method: "PUT",
          body: formData,
        });
      } else {
        res = await fetch(`/api/posts/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newBody }),
        });
      }

      if (!res.ok) throw new Error("Failed to update post");
      setImage(null);
      setImagePreview(null);
      router.refresh();
      router.push("/");
    } catch (error) {
      console.log(error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  return (
    <div className="reddit-main-column sticky z-10 flex w-full flex-col border-r-1 border-gray-200 py-2">
      <form
        onSubmit={handleSubmit}
        className="mb-6 flex flex-col justify-around border-b-1 border-gray-200"
      >
        <input
          onChange={(e) => setNewBody(e.target.value)}
          value={newBody}
          className="mb-2 h-24 resize-none border-b-1 border-gray-200 bg-gray-50 px-4 py-4 outline-blue-400"
          type="text"
          placeholder="What's on your mind?"
        />
        {imagePreview && (
          <div className="relative my-2">
            <img src={imagePreview} alt="Preview" className="rounded-md" />
            <button
              type="button"
              onClick={removeImage}
              className="bg-opacity-50 absolute top-2 right-2 rounded-full bg-black p-1 text-white"
            >
              &times;
            </button>
          </div>
        )}

        <div className="flex flex-row items-center justify-between gap-2 pl-6 text-2xl text-cyan-500">
          <input
            type="file"
            id="editImageInput"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <label htmlFor="editImageInput">
            <PiImageSquareBold className="hover:text-muted cursor-pointer" />
          </label>

          <div className="flex flex-row justify-end-safe">
            <button className="mx-2 my-2 h-10 cursor-pointer rounded-3xl bg-gray-500 px-4 text-sm font-bold text-white hover:bg-blue-400">
              Update
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditPostPage;
