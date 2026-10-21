import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  PenLine,
  LoaderCircle,
  CalendarDays,
  FileText,
  ArrowLeft,
  Heart,
  Settings,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const BACKEND_URL = "http://localhost:8000";

const getImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${BACKEND_URL}${path}`;
};
const stripMarkdown = (text = "") =>
  text
    .replace(/```[\s\S]*?```/g, "[Code] ") // Replaces big code blocks with "[Code]"
    .replace(/!\[.*?\]\(.*?\)/g, "") // Removes markdown image links
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Turns [link text](url) into "link text"
    .replace(/[#>*_`~-]/g, "") // Removes #, >, *, _, `, ~, - symbols
    .replace(/\s+/g, " ") // Collapses extra spaces/newlines
    .trim();
const AuthorProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [author, setAuthor] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentUserId = user?._id || user?.id;
  const isOwnProfile =
    Boolean(currentUserId) &&
    Boolean(id) &&
    currentUserId.toString() === id.toString();

  useEffect(() => {
    let active = true;

    const fetchAuthorProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/profile/${id}`);

        if (!active) return;

        setAuthor(response.data.author);
        setBlogs(response.data.blogs || []);
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to load this author's profile.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchAuthorProfile();

    return () => {
      active = false;
    };
  }, [id]);

  const totalLikesReceived = useMemo(() => {
    return blogs.reduce(
      (sum, blog) => sum + (Array.isArray(blog.likes) ? blog.likes.length : 0),
      0,
    );
  }, [blogs]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <LoaderCircle className="animate-spin text-violet-600" size={36} />
      </div>
    );
  }

  if (error || !author) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
        <h2 className="text-2xl font-bold text-neutral-900">
          Author not found
        </h2>
        <p className="mt-3 text-neutral-500">
          {error || "The profile you are looking for does not exist."}
        </p>
        <Link
          to="/explore"
          className="mt-6 rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          Back to Explore
        </Link>
      </div>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="min-h-screen bg-neutral-50 px-4 py-10 sm:px-6 lg:py-14"
    >
      <div className="mx-auto max-w-5xl">
        <Link
          to="/explore"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition hover:text-black"
        >
          <ArrowLeft size={16} />
          Back to Explore
        </Link>

        {/* Author Header Card */}
        <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <div className="h-32 bg-gradient-to-r from-neutral-900 via-neutral-800 to-violet-950 sm:h-40" />

          <div className="px-6 pb-8 sm:px-10">
            <div className="relative -mt-12 mb-4 flex flex-wrap items-end justify-between gap-4 sm:-mt-16">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-neutral-100 text-neutral-400 shadow-sm sm:h-32 sm:w-32">
                {author.profileImage ? (
                  <img
                    src={getImageUrl(author.profileImage)}
                    alt={author.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User size={48} />
                )}
              </div>

              {isOwnProfile && (
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50"
                >
                  <Settings size={16} />
                  Edit My Profile
                </Link>
              )}
            </div>

            <h1 className="text-3xl font-bold text-neutral-900">
              {author.name}
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-relaxed text-neutral-600">
              {author.bio || "Writer on BlogSphere."}
            </p>

            {/* Author Stats & Join Date */}
            <div className="mt-6 flex flex-wrap items-center gap-5 border-t border-neutral-100 pt-5 text-sm text-neutral-500">
              <div className="flex items-center gap-1.5">
                <FileText size={16} className="text-neutral-400" />
                <span className="font-semibold text-neutral-900">
                  {blogs.length}
                </span>
                <span>{blogs.length === 1 ? "Story" : "Stories"}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Heart size={16} className="text-rose-500" />
                <span className="font-semibold text-neutral-900">
                  {totalLikesReceived}
                </span>
                <span>{totalLikesReceived === 1 ? "Like" : "Likes"}</span>
              </div>

              {author.createdAt && (
                <div className="flex items-center gap-1.5">
                  <CalendarDays size={16} className="text-neutral-400" />
                  <span>
                    Joined{" "}
                    {new Date(author.createdAt).toLocaleDateString("en-IN", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Published Stories by Author */}
        <div className="mt-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-neutral-900">
              <FileText size={20} className="text-neutral-400" />
              Stories by {author.name}
            </h2>
            <span className="rounded-full bg-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-700">
              {blogs.length}
            </span>
          </div>

          {blogs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
                <PenLine size={24} className="text-neutral-500" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-neutral-900">
                No stories published yet
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
                {author.name} hasn't published any stories yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {blogs.map((blog, index) => (
                <motion.article
                  key={blog._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                  className="overflow-hidden rounded-3xl border border-neutral-200 bg-white transition-shadow hover:shadow-xl"
                >
                  <Link to={`/blogs/${blog._id}`} className="block">
                    <div className="h-48 bg-neutral-100">
                      {blog.coverImage ? (
                        <img
                          src={getImageUrl(blog.coverImage)}
                          alt={blog.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-neutral-300">
                          <PenLine size={32} />
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      {Array.isArray(blog.tags) && blog.tags.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-1.5">
                          {blog.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <h3 className="line-clamp-2 text-lg font-semibold text-neutral-900">
                        {blog.title}
                      </h3>

                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-neutral-500">
                        {stripMarkdown(blog.content)}
                      </p>

                      <div className="mt-4 flex items-center justify-between text-xs text-neutral-400">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays size={14} />
                          <time dateTime={blog.createdAt}>
                            {new Date(blog.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </time>
                        </div>

                        <div className="flex items-center gap-1">
                          <Heart size={13} />
                          <span>{blog.likes?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.main>
  );
};

export default AuthorProfile;
