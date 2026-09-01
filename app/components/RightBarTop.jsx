"use client";

import { useState, useEffect } from "react";

export default function News() {
  const [news, setNews] = useState([]);
  const [articleNum, setArticleNum] = useState(3);

  useEffect(() => {
    fetch("/api/news?country=us&category=business")
      .then((res) => res.json())
      .then((data) =>
        setNews(Array.isArray(data.articles) ? data.articles : []),
      )
      .catch((error) => {
        console.error("Failed to fetch news:", error);
        setNews([]);
      });
  }, []);

  return (
    <div className="border-default bg-panel text-primary flex flex-col space-y-3 rounded-xl border pt-2">
      <h4 className="px-4 pt-2 text-xl font-bold">Whats happening</h4>
      {news.slice(0, articleNum).map((article) => (
        <div key={article.url}>
          <a href={article.url} target="_blank" rel="noreferrer">
            <div className="hover-panel flex items-center justify-between space-x-1 px-4 py-2 transition duration-200">
              <div className="space-y-0.5">
                <h6 className="text-sm font-bold">{article.title}</h6>
                <p className="text-muted text-xs font-medium">
                  {article.source.name}
                </p>
              </div>
              <img
                src={article.urlToImage}
                width={70}
                className="rounded-xl"
                alt=""
              />
            </div>
          </a>
        </div>
      ))}
      <button
        onClick={() => setArticleNum(articleNum + 3)}
        className="text-primary cursor-pointer pb-3 pl-4 text-sm font-semibold hover:text-cyan-500"
      >
        Load more
      </button>
    </div>
  );
}
