import User from "@/models/user";

/**
 * Generate a unique username based on user's name.
 * Falls back to random suffix if base username is taken.
 */
export async function generateUniqueUsername(fullName: string | null | undefined): Promise<string> {
  if (!fullName) {
    return `user_${Math.random().toString(36).substr(2, 9)}`;
  }

  const nameParts = fullName.trim().toLowerCase().split(/\s+/).filter(Boolean);
  let baseUsername = "";

  if (nameParts.length === 1) {
    baseUsername = nameParts[0];
  } else if (nameParts.length === 2) {
    baseUsername = nameParts[0] + nameParts[1];
  } else {
    baseUsername = nameParts[0] + nameParts[nameParts.length - 1];
  }

  baseUsername = baseUsername.replace(/[^a-z0-9]/g, "");

  if (!baseUsername) {
    return `user_${Math.random().toString(36).substr(2, 9)}`;
  }

  let username = baseUsername;
  let counter = 1;
  let isAvailable = !(await User.findOne({ username }));

  while (!isAvailable && counter < 100) {
    username = `${baseUsername}${counter}`;
    isAvailable = !(await User.findOne({ username }));
    counter++;
  }

  if (!isAvailable) {
    username = `${baseUsername}_${Math.random().toString(36).substr(2, 5)}`;
  }

  return username;
}
