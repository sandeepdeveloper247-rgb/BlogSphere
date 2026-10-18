import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { motion } from "framer-motion";
import { ArrowRight, PenLine, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const { isAuthenticated } = useAuth();

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await api.get("/blogs");

        setBlogs(response.data.blogs);
      } catch (error) {
        console.error("Failed to fetch blogs:", error);

        setError("Unable to load stories right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);
  return (
    <main className="min-h-screen bg-neutral-50">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-180px] h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-neutral-200/60 blur-3xl" />

          <div className="absolute right-[-100px] top-40 h-[250px] w-[250px] rounded-full bg-neutral-200/50 blur-3xl" />
        </div>

        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-4xl text-center">
            {/* Small badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-7 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-600 shadow-sm"
            >
              <Sparkles size={16} />

              <span>A place for ideas and stories</span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl font-bold tracking-tight text-neutral-950 sm:text-6xl md:text-7xl"
            >
              Ideas worth reading.
              <br />
              <span className="text-neutral-400">Stories worth sharing.</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mx-auto mt-7 max-w-2xl text-base leading-7 text-neutral-500 sm:text-lg"
            >
              Discover interesting perspectives, share your experiences, and
              connect with people through the power of writing.
            </motion.p>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Link to="/explore">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-center gap-2 rounded-full bg-black px-6 py-3.5 font-medium text-white shadow-lg shadow-black/10"
                >
                  Explore Blogs
                  <ArrowRight size={18} />
                </motion.div>
              </Link>

              <Link to={isAuthenticated ? "/create" : "/register"}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-6 py-3.5 font-medium text-neutral-800 transition hover:bg-neutral-100"
                >
                  <PenLine size={18} />

                  {isAuthenticated ? "Write a Blog" : "Start Writing"}
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Latest Stories */}
      <section className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-neutral-400">
                Discover
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
                Latest Stories
              </h2>

              <p className="mt-3 max-w-xl text-neutral-500">
                Fresh perspectives and stories from the BlogSphere community.
              </p>
            </div>

            <Link
              to="/explore"
              className="hidden items-center gap-2 text-sm font-semibold text-neutral-700 transition hover:text-black sm:flex"
            >
              View all
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Empty state for now */}
          {loading ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
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
            <div className="mt-10 rounded-3xl border border-red-200 bg-red-50 px-6 py-12 text-center">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : blogs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mt-10 rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-16 text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                <PenLine size={22} className="text-neutral-500" />
              </div>

              <h3 className="mt-5 text-xl font-semibold text-neutral-900">
                No stories yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
                Be one of the first people to share something with the
                BlogSphere community.
              </p>

              <Link
                to={isAuthenticated ? "/create" : "/register"}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                <PenLine size={16} />

                {isAuthenticated
                  ? "Write your first blog"
                  : "Create an account"}
              </Link>
            </motion.div>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {blogs.slice(0, 6).map((blog, index) => (
                <Link
                  to={`/blogs/${blog._id}`}
                  key={blog._id}
                  className="block"
                >
                  <motion.article
                    key={blog._id}
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.05,
                    }}
                    whileHover={{ y: -5 }}
                    className="overflow-hidden rounded-3xl border border-neutral-200 bg-white transition-shadow hover:shadow-xl"
                  >
                    <div className="h-52 bg-neutral-100">
                      {blog.coverImage ? (
                        <img
                          src={`http://localhost:8000${blog.coverImage}`}
                          alt={blog.title}
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            console.error(
                              "Image failed to load:",
                              event.currentTarget.src,
                            );
                          }}
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

                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-neutral-500">
                        {blog.content}
                      </p>

                      <div className="mt-6 flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-neutral-900 text-sm font-medium text-white">
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
                            blog.author?.name?.charAt(0).toUpperCase()
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-medium text-neutral-800">
                            {blog.author?.name}
                          </p>

                          <p className="text-xs text-neutral-400">
                            {new Date(blog.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Home;
