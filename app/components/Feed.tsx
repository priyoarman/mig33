import AddPost from "./AddPost";
import PostsList from "./PostsList";

export default function Feed() {
  return (
    <div className="reddit-main-column border-default sticky z-10 flex w-full flex-col border-r-1 py-2">
      <AddPost />
      <PostsList />
    </div>
  );
}
