import Link from "next/link";
import Image from "next/image";
import { GoHomeFill } from "react-icons/go";
import { MdExplore } from "react-icons/md";
import { BsSearch } from "react-icons/bs";
import { FaBell } from "react-icons/fa";
import { FaEnvelope } from "react-icons/fa6";
import { FaUserCircle } from "react-icons/fa";
import MiniProfile from "./MiniProfile";

const LeftBar = () => {
  return (
    <aside className="reddit-left-column bg-panel border-default z-0 sm:sticky sm:top-0 sm:flex sm:h-screen sm:flex-col sm:items-stretch sm:justify-center sm:border-r-1 sm:py-3 lg:px-3">
      <div className="bg-panel text-primary fixed inset-x-0 bottom-0 z-0 flex flex-row items-center justify-around space-y-2 px-4 py-2 sm:static sm:inset-auto sm:bottom-auto sm:flex sm:h-screen sm:w-full sm:flex-col sm:items-start sm:justify-start">
        <Link
          href={"/"}
          className="hover-panel text-accent hidden sm:flex sm:w-full sm:items-center sm:justify-start sm:space-x-1 sm:rounded-3xl sm:px-1 sm:py-2 sm:pl-5 sm:text-[28px] sm:font-bold sm:transition sm:duration-200"
        >
          <Image
            src="/mig33.png"
            width={56}
            height={56}
            alt="mig33"
            className="animate-[spin_5s] [animation-iteration-count:infinite]"
          />
          {/* <p className="hidden lg:block">Twitter</p> */}
        </Link>
        <Link
          href={"/"}
          className="text-primary hover-accent mt-2 flex w-full items-center justify-center space-x-2 rounded-3xl px-2 py-2 pl-4 text-2xl font-bold transition duration-200 sm:justify-start lg:w-fit lg:px-4 lg:text-xl"
        >
          <GoHomeFill className="text-2xl" />
          <p className="hidden lg:block">Home</p>
        </Link>
        <Link
          href={"/explore"}
          className="text-primary hover-accent flex w-full items-center justify-center space-x-2 rounded-3xl px-2 py-2 pl-4 text-2xl font-bold transition duration-200 sm:justify-start lg:w-fit lg:px-4 lg:text-xl"
        >
          <MdExplore className="text-2xl" />
          <p className="hidden lg:block">Explore</p>
        </Link>
        <Link
          href={"/search"}
          className="text-primary hover-accent flex w-full items-center justify-center space-x-2 rounded-3xl px-2 py-2 pl-4 text-2xl font-bold transition duration-200 sm:justify-start lg:w-fit lg:px-4 lg:text-xl"
        >
          <BsSearch className="text-2xl" />
          <p className="hidden lg:block">Search</p>
        </Link>
        <Link
          href={"/notifications"}
          className="text-primary hover-accent flex w-full items-center justify-center space-x-2 rounded-3xl px-2 py-2 pl-4 text-2xl font-bold transition duration-200 sm:justify-start lg:w-fit lg:px-4 lg:text-xl"
        >
          <FaBell className="text-2xl" />

          <p className="hidden lg:block">Notifications</p>
        </Link>
        <Link
          href={"/messages"}
          className="text-primary hover-accent flex w-full items-center justify-center space-x-2 rounded-3xl px-2 py-2 pl-4 text-2xl font-bold transition duration-200 sm:justify-start lg:w-fit lg:px-4 lg:text-xl"
        >
          <FaEnvelope className="text-xl" />

          <p className="ml-1 hidden lg:block">Messages</p>
        </Link>
        <Link
          href={"/profile"}
          className="text-primary hover-accent flex w-full items-center justify-center space-x-2 rounded-3xl px-2 py-2 pb-4 pl-4 text-2xl font-bold transition duration-200 sm:justify-start sm:pb-2 lg:w-fit lg:px-4 lg:text-xl"
        >
          <FaUserCircle className="text-xl" />

          <p className="ml-1 hidden lg:block">Profile</p>
        </Link>
      </div>

      <div className="hidden w-full flex-row justify-between gap-2 rounded-sm px-2 py-2 lg:flex">
        <MiniProfile />
      </div>
    </aside>
  );
};

export default LeftBar;
