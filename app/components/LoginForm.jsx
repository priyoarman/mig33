"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa6";
import { FaGithub } from "react-icons/fa6";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });
      if (res?.error) {
        setError("Invalid Credentials");
        setTimeout(() => setError(""), 3000);
        return;
      }
      if (!res.error) {
        router.push("/profile");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="border-default sticky flex h-screen w-full flex-col items-center justify-center border-r-1 px-4 pb-32 sm:pb-0">
      <div className="w-full max-w-xl px-5">
        <h1 className="flex flex-row items-center justify-center text-2xl font-semibold text-gray-700">
          Welcome Back!
        </h1>
        <form
          onSubmit={handleSubmit}
          className="mt-4 flex w-full flex-col items-center justify-center gap-4"
        >
          <input
            className="w-full max-w-md rounded-full border-1 border-gray-200 bg-gray-50 px-6 py-2 text-[16px] text-gray-900 placeholder-gray-500"
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
          />
          <input
            className="w-full max-w-md rounded-full border-1 border-gray-200 bg-gray-50 px-6 py-2 text-[16px] text-gray-900 placeholder-gray-500"
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
          />
          <div className="flex w-full max-w-md flex-col justify-between gap-y-2">
            <button className="w-full cursor-pointer rounded-full bg-blue-400 px-4 py-2 text-[16px] text-white hover:bg-blue-500">
              Login
            </button>
            <Link href="/register">
              <div className="mt-2 flex flex-row items-center justify-center gap-1 text-sm text-gray-700 sm:flex sm:flex-row">
                Don't have an account?{" "}
                <span className="text-emerald-600 hover:text-emerald-500 hover:underline">
                  Register!
                </span>
              </div>
            </Link>
          </div>
        </form>
        {error && (
          <div className="mt-4 flex justify-center">
            <div className="animate-pulse rounded-sm bg-red-500 px-3 py-1 text-sm text-white">
              {error}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col py-4 text-lg text-gray-700">OR</div>

      <div className="flex w-full max-w-md flex-col gap-y-4 px-5">
        <button
          onClick={() => signIn("google", { callbackUrl: "/profile" })}
          className="flex w-full cursor-pointer flex-row items-center justify-center gap-x-2 rounded-full border-1 border-gray-200 px-4 py-2"
        >
          <FcGoogle />
          <span className="text-[16px] font-light text-gray-600">
            Continue with Google
          </span>
        </button>
        {/* <button className="flex cursor-pointer flex-row items-center justify-between gap-x-3 rounded-full border-1 border-gray-200 px-4 py-2">
          <FaFacebook className="text-blue-600" />
          <span className="text-[16px] font-light text-gray-600">
            Continue with Facebook
          </span>
        </button> */}
        <button
          onClick={() => signIn("github", { callbackUrl: "/profile" })}
          className="flex w-full cursor-pointer flex-row items-center justify-center gap-x-2 rounded-full border-1 border-gray-200 px-4 py-2"
        >
          <FaGithub />
          <span className="text-[16px] font-light text-gray-600">
            Continue with Github
          </span>
        </button>
      </div>
    </div>
  );
};

export default LoginForm;
