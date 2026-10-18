import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  PenLine,
  SlidersHorizontal,
  ArrowUpDown,
  X,
} from "lucide-react";
import api from "../services/api";

const Explore = () => {
  const [blogs, setBlogs] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchBlogs = async () => {
      try {
        const response = await api.get("/blogs");

        if (active) {
          setBlogs(response.data.blogs || []);
          setError("");
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to load blogs. Please try again.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchBlogs();

    return () => {
      active = false;
    };
  }, []);

  const filteredBlogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = blogs.filter((blog) => {
      const title = blog.title || "";
      const content = blog.content || "";
      const author = blog.author?.name || "";

      return (
        title.toLowerCase().includes(query) ||
        content.toLowerCase().includes(query) ||
        author.toLowerCase().includes(query)
      );
    });

    return result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      return sortBy === "oldest" ? dateA - dateB : dateB - dateA;
    });
  }, [blogs, search, sortBy]);

  return (
    <main className="min-h-screen bg-neutral-50">
      {/* Page heading */}
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-400">
              The BlogSphere community
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight text-neutral-950 sm:text-5xl">
              Explore stories<span className="text-neutral-400">.</span>
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-500">
              Discover fresh ideas, find new perspectives, and read stories
              shared by the community.
            </p>
          </motion.div>

          {/* Search and sorting */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search
                size={19}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search stories, content, or authors..."
                aria-label="Search blogs"
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-3.5 pl-11 pr-11 text-sm outline-none transition focus:border-neutral-400 focus:bg-white focus:ring-4 focus:ring-neutral-100"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-800"
                >
                  <X size={17} />
                </button>
              )}
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3">
              <ArrowUpDown size={18} className="shrink-0 text-neutral-500" />

              <span className="text-sm text-neutral-500">Sort:</span>

              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                aria-label="Sort blogs"
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-neutral-800 outline-none"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      {/* Blog listing */}
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-7 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">
              {search ? "Search results" : "All stories"}
            </h2>

            {!loading && !error && (
              <p className="mt-1 text-sm text-neutral-500">
                {filteredBlogs.length}{" "}
                {filteredBlogs.length === 1 ? "story" : "stories"} found
              </p>
            )}
          </div>

          <SlidersHorizontal size={20} className="text-neutral-400" />
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="animate-pulse overflow-hidden rounded-3xl border border-neutral-200 bg-white"
              >
                <div className="h-52 bg-neutral-200" />

                <div className="space-y-3 p-6">
                  <div className="h-5 w-3/4 rounded bg-neutral-200" />
                  <div className="h-4 w-full rounded bg-neutral-200" />
                  <div className="h-4 w-2/3 rounded bg-neutral-200" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-12 text-center">
            <p className="text-sm text-red-600">{error}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Try again
            </button>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
              {search ? (
                <Search size={23} className="text-neutral-500" />
              ) : (
                <PenLine size={23} className="text-neutral-500" />
              )}
            </div>

            <h3 className="mt-5 text-xl font-semibold text-neutral-900">
              {search ? "No matching stories" : "No stories published yet"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
              {search
                ? "Try a different title, keyword, or author name."
                : "Be the first to share an idea with the BlogSphere community."}
            </p>

            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-6 rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-medium hover:bg-neutral-50"
              >
                Clear search
              </button>
            ) : (
              <Link
                to="/create"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-medium text-white hover:bg-neutral-800"
              >
                <PenLine size={16} />
                Write a story
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBlogs.map((blog, index) => (
              <motion.article
                key={blog._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: Math.min(index * 0.04, 0.24),
                }}
                whileHover={{ y: -5 }}
                className="overflow-hidden rounded-3xl border border-neutral-200 bg-white transition-shadow hover:shadow-xl"
              >
                <Link to={`/blogs/${blog._id}`} className="block">
                  <div className="h-52 bg-neutral-100">
                    {blog.coverImage ? (
                      <img
                        src={`http://localhost:8000${blog.coverImage}`}
                        alt={blog.title || "Blog cover"}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-neutral-400">
                        <PenLine size={30} />
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="line-clamp-2 text-xl font-semibold text-neutral-900">
                      {blog.title}
                    </h3>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-neutral-500">
                      {blog.content}
                    </p>

                    <div className="mt-6 flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-900 text-sm font-medium text-white">
                        {blog.author?.profileImage ? (
                          <img
                            src={
                              blog.author.profileImage.startsWith("http")
                                ? blog.author.profileImage
                                : `http://localhost:8000${blog.author.profileImage}`
                            }
                            alt={blog.author.name || "Author"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          blog.author?.name?.charAt(0).toUpperCase() || "?"
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-neutral-800">
                          {blog.author?.name || "Unknown author"}
                        </p>

                        <p className="text-xs text-neutral-400">
                          {blog.createdAt
                            ? new Date(blog.createdAt).toLocaleDateString()
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Explore;
