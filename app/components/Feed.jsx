import { BsSearch } from "react-icons/bs";
import AddPost from "./AddPost";
import MiniProfile from "./MiniProfile";
import PostsList from "./PostsList";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "./ThemeToggle";

export default function Feed() {
  return (
    <div className="reddit-main-column border-default sticky z-10 flex w-full flex-col border-r-1 py-2">
      <div className="border-default flex h-12 flex-row items-stretch justify-between border-b-1 sm:hidden">
        <div className="border-default ml-2 flex h-10 w-10 cursor-pointer rounded-full border-1 bg-neutral-600 px-3 pt-1"></div>
        <Link
          href={"/"}
          className="text-blue-40 hover-panel mx-auto flex w-fit items-center justify-center space-x-2 rounded-3xl px-4 pb-2 text-[28px] font-bold text-blue-400 transition duration-200 lg:w-fit lg:px-4"
        >
          <Image
            src="/ReDI.png"
            width={28}
            height={28}
            alt="ReDI"
            className="animate-[spin_5s] [animation-iteration-count:infinite]"
          />
          {/* <p className="hidden lg:block">Twitter</p> */}
        </Link>
        <div className="border-default mr-2 flex h-10 w-fit cursor-pointer rounded-full border px-[9px]">
          <ThemeToggle />
        </div>
      </div>
      <AddPost />
      <PostsList />
    </div>
  );
}
