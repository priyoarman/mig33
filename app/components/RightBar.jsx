"use client";

import RightBarTop from "./RightBarTop";
import RightBarBottom from "./RightBarBottom";
import SearchBar from "./SearchBar";

const RightBar = () => {
  return (
    <div className="reddit-right-column sticky hidden flex-col items-stretch gap-3 overflow-x-hidden overflow-y-auto px-2 py-2 sm:flex">
      <SearchBar />
      <RightBarTop />
      <RightBarBottom />
    </div>
  );
};

export default RightBar;
