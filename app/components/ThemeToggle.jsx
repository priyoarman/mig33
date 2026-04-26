"use client";

import { useEffect, useState } from "react";
import { FaMoon } from "react-icons/fa";
import { IoMdSunny } from "react-icons/io";

export default function ThemeToggle() {
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("site-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored || (prefersDark ? "dark" : "light");
    
    setTheme(initial);
    document.documentElement.classList.toggle("theme-dark", initial === "dark");
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("site-theme", next);
    document.documentElement.classList.toggle("theme-dark", next === "dark");
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="flex items-center gap-2" 
      style={{background: "transparent", color: "var(--text)" }}
    >
      <span className="hidden sm:flex font-medium">Theme:</span>
      
      {/* Icon Container with transition */}
      <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
        <div className={`transform transition-all duration-500 ease-spring ${
          theme === "dark" ? "translate-y-0 opacity-100 rotate-0" : "translate-y-8 opacity-0 rotate-45"
        }`}>
          <FaMoon size={18} />
        </div>
        <div className={`absolute transform transition-all duration-500 ease-spring ${
          theme === "light" ? "translate-y-0 opacity-100 rotate-0" : "-translate-y-8 opacity-0 -rotate-45"
        }`}>
          <IoMdSunny size={20} className="text-yellow-500" />
        </div>
        {theme === null && <span className="animate-pulse">...</span>}
      </div>
    </button>
  );
}