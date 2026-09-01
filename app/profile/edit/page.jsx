"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function EditProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [form, setForm] = useState({
    name: "",
    bio: "",
    website: "",
    profileImage: "",
    coverImage: "",
  });
  const [profilePreview, setProfilePreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (status !== "authenticated" || !session?.user?.id) return;

      try {
        const res = await fetch("/api/profile/me");
        const data = await res.json();

        if (!res.ok) throw new Error(data?.error || "Failed to load profile");

        setForm({
          name: data.user?.name || "",
          bio: data.user?.bio || "",
          website: data.user?.website || "",
          profileImage: data.user?.profileImage || "",
          coverImage: data.user?.coverImage || "",
        });
        setProfilePreview(data.user?.profileImage || "");
        setCoverPreview(data.user?.coverImage || "");
      } catch (error) {
        console.error("Failed to load profile data:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadProfile();
  }, [session, status]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (event, type) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (type === "profile") {
        setProfilePreview(reader.result);
        setForm((prev) => ({ ...prev, profileImage: reader.result }));
      } else {
        setCoverPreview(reader.result);
        setForm((prev) => ({ ...prev, coverImage: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status !== "authenticated") return;

    setLoading(true);

    try {
      const payload = new FormData();
      payload.append("name", form.name);
      payload.append("bio", form.bio);
      payload.append("website", form.website);

      if (form.profileImage && form.profileImage.startsWith("data:image")) {
        const file = await fetch(form.profileImage).then((res) => res.blob());
        payload.append("profileImage", file, "profile.jpg");
      }

      if (form.coverImage && form.coverImage.startsWith("data:image")) {
        const file = await fetch(form.coverImage).then((res) => res.blob());
        payload.append("coverImage", file, "cover.jpg");
      }

      const res = await fetch("/api/profile/edit", {
        method: "PUT",
        body: payload,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update profile");

      router.push("/profile");
      router.refresh();
    } catch (error) {
      console.error("Update profile failed:", error);
      alert(
        error.message || "Something went wrong while updating the profile.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || initialLoading) {
    return (
      <div className="bg-panel text-primary flex min-h-screen items-center justify-center">
        Loading profile editor...
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="bg-panel text-primary flex min-h-screen items-center justify-center">
        Please log in to edit your profile.
      </div>
    );
  }

  return (
    <div className="bg-panel text-primary min-h-screen px-4 py-8">
      <div className="border-default mx-auto max-w-3xl rounded-2xl border bg-white/5 p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Edit profile</h1>
            <p className="text-muted text-sm">Update your public info</p>
          </div>
          <button
            onClick={() => router.push("/profile")}
            className="border-default rounded-full border px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Cover photo
            </label>
            <div className="border-default relative h-40 overflow-hidden rounded-xl border bg-gray-200">
              {coverPreview ? (
                <Image
                  src={coverPreview}
                  alt="Cover preview"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-500">
                  No cover image
                </div>
              )}
              <label className="absolute top-3 right-3 cursor-pointer rounded-full bg-black/60 px-3 py-1 text-xs text-white hover:bg-black/80">
                Upload cover
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageChange(e, "cover")}
                />
              </label>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-gray-200 shadow-md">
              {profilePreview ? (
                <Image
                  src={profilePreview}
                  alt="Profile preview"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-lg font-bold text-gray-600">
                  {form.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </div>

            <label className="cursor-pointer rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-600">
              Change photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageChange(e, "profile")}
              />
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="border-default bg-panel w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                placeholder="Your name"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">Bio</label>
              <textarea
                name="bio"
                rows={4}
                value={form.bio}
                onChange={handleChange}
                className="border-default bg-panel w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                placeholder="Tell people about yourself"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">
                Website / link
              </label>
              <input
                name="website"
                value={form.website}
                onChange={handleChange}
                className="border-default bg-panel w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="border-default rounded-full border px-5 py-2 font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-cyan-500 px-5 py-2 font-semibold text-white hover:bg-cyan-600 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
