"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa6";
import { FaGithub } from "react-icons/fa6";
import { signIn } from "next-auth/react";

const RegisterForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("All fields are necessary.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (res.ok) {
        e.target.reset();
        router.push("/login");
      } else {
        setError("Registration failed.");
        setTimeout(() => setError(""), 3000);
      }
    } catch (error) {
      console.log(error);
      setError("An error occurred.");
    }
  };

  return (
    <div className="sticky container flex h-screen w-full flex-col place-items-center items-center justify-center pb-32 border-r-1 border-default sm:pb-0 sm:w-screen lg:w-2/4">
      <div className="place-items-center px-5">
        <h1 className="flex flex-row justify-center items-center text-2xl font-semibold text-gray-700">
          Enter your details
        </h1>
        <form
          onSubmit={handleSubmit}
          className="mt-4 flex flex-col items-center justify-center gap-4"
        >
          <input
            className="w-full rounded-full border-1 border-gray-200 bg-gray-50 px-6 py-2 text-[16px] text-gray-900 placeholder-gray-500 sm:w-[400px]"
            onChange={(e) => setName(e.target.value)}
            type="text"
            placeholder="Name"
          />
          <input
            className="w-full rounded-full border-1 border-gray-200 bg-gray-50 px-6 py-2 text-[16px] text-gray-900 placeholder-gray-500 sm:w-[400px]"
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
          />
          <input
            className="w-full rounded-full border-1 border-gray-200 bg-gray-50 px-6 py-2 text-[16px] text-gray-900 placeholder-gray-500 sm:w-[400px]"
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
          />
          <div className="flex w-full flex-col justify-between">
            <button
              className="flex w-full cursor-pointer flex-row items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500"
              type="submit"
            >
              Register
            </button>
            <Link href="/login">
              <div className="mt-2 flex flex-row justify-center items-center gap-1 text-right text-sm text-gray-700">
                Already have an account?{" "}
                <span className="text-blue-400 hover:underline">
                  Login!
                </span>
              </div>
            </Link>
          </div>
        </form>
        {error && (
          <div className="mt-4 w-fit rounded-sm bg-red-500 px-3 py-1 text-sm text-white animate-pulse">
            {error}
          </div>
        )}
      </div>

      <div className="flex flex-col py-4 text-gray-700 text-lg">OR</div>
      <div className="flex flex-col gap-y-4">
        <button onClick={() => signIn("google", { callbackUrl: "/profile" })} className="flex cursor-pointer flex-row items-center justify-between gap-x-3 rounded-full border-1 border-gray-200 px-4 py-2">
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
        <button onClick={() => signIn("github", { callbackUrl: "/profile" })} className="flex cursor-pointer flex-row items-center justify-between gap-x-3 rounded-full border-1 border-gray-200 px-4 py-2">
          <FaGithub />
          <span className="text-[16px] font-light text-gray-600">
            Continue with Github
          </span>
        </button>
      </div>
    </div>
  );
};

export default RegisterForm;
