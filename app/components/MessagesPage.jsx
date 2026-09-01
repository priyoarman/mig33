import { BsSearch } from "react-icons/bs";
import MiniProfile from "./MiniProfile";
import Link from "next/link";
import Image from "next/image";

const MessagesPage = () => {
  return (
    <div className="reddit-main-column sticky z-10 flex w-full flex-col border-r-1 border-gray-200 py-2">
      <div className="flex h-12 flex-row items-stretch justify-between border-b-1 border-gray-200 sm:hidden">
        <div className="flex cursor-pointer px-4">
          <MiniProfile />
        </div>
        <Link
          href={"/"}
          className="text-blue-40 flex w-fit items-center justify-center space-x-2 rounded-3xl px-4 pr-6 pb-2 text-[28px] font-bold text-blue-400 transition duration-200 hover:bg-gray-200 lg:w-fit lg:px-4"
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
        <div className="mr-2 flex h-10 w-fit cursor-pointer rounded-2xl border-1 border-gray-200 px-3 pt-2">
          <BsSearch />
        </div>
      </div>
      <div className="flex h-screen animate-pulse flex-col items-center justify-center py-4">
        <h1 className="flex w-full items-center justify-center space-y-2 text-center text-2xl font-semibold text-blue-400">
          Hello there!
        </h1>
        <h2 className="flex w-full items-center justify-center space-y-2 text-center text-xl font-semibold text-gray-600">
          This page is still under construction!
        </h2>
      </div>
    </div>
  );
};

export default MessagesPage;
