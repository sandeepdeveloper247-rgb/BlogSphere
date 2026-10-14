import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { MessageCircle, Send } from "lucide-react";
import { motion } from "framer-motion";
import socket from "../services/socket";
import {
  ArrowLeft,
  CalendarDays,
  UserRound,
  LoaderCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import api from "../services/api";

const BACKEND_URL = "http://localhost:8000";

function BlogDetails() {
  const { id } = useParams();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState("");
  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/blogs/${id}`);
        setBlog(response.data.blog);
        const fetchedBlog = response.data.blog;

        setLikesCount(fetchedBlog.likes?.length || 0);

        const currentUserId = user?._id || user?.id;

        setIsLiked(
          !!currentUserId &&
            fetchedBlog.likes?.some((like) => {
              const likedUserId = like._id || like;
              return likedUserId.toString() === currentUserId.toString();
            }),
        );
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load this blog. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id]);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setCommentsLoading(true);
        setCommentError("");

        const response = await api.get(`/comments/${id}`);
        setComments(response.data.comments);
      } catch (error) {
        setCommentError(
          error.response?.data?.message ||
            "Unable to load comments. Please try again.",
        );
      } finally {
        setCommentsLoading(false);
      }
    };

    fetchComments();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const handleNewComment = (newComment) => {
      setComments((previousComments) => {
        // Prevent duplicates for the user who posted the comment.
        const alreadyExists = previousComments.some(
          (comment) => comment._id === newComment._id,
        );

        if (alreadyExists) return previousComments;

        return [...previousComments, newComment];
      });
    };

    // Register the listener before joining the room.
    socket.on("new-comment", handleNewComment);

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("join-blog", id);

    return () => {
      socket.off("new-comment", handleNewComment);
      socket.emit("leave-blog", id);
    };
  }, [id]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (isLiking) return;

    try {
      setIsLiking(true);

      const response = await api.post(`/blogs/${id}/like`);

      setIsLiked(response.data.isLiked);
      setLikesCount(response.data.likesCount);
    } catch (error) {
      console.error(
        "Failed to update like:",
        error.response?.data?.message || error.message,
      );
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentSubmit = async (event) => {
    event.preventDefault();

    const content = commentText.trim();

    if (!content || commentSubmitting) return;

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      setCommentSubmitting(true);
      setCommentError("");

      const response = await api.post(`/comments/${id}`, {
        content,
      });

      setComments((previousComments) => [
        ...previousComments,
        response.data.comment,
      ]);

      setCommentText("");
    } catch (error) {
      setCommentError(
        error.response?.data?.message ||
          "Unable to post your comment. Please try again.",
      );
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteBlog = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this blog? This action cannot be undone.",
    );

    if (!confirmed || isDeleting) return;

    try {
      setIsDeleting(true);
      setDeleteError("");

      await api.delete(`/blogs/${id}`);

      navigate("/explore", {
        replace: true,
        state: { message: "Blog deleted successfully." },
      });
    } catch (error) {
      setDeleteError(
        error.response?.data?.message ||
          "Unable to delete this blog. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <LoaderCircle className="animate-spin text-violet-600" size={36} />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
        <h2 className="text-2xl font-bold text-neutral-900">
          Blog unavailable
        </h2>
        <p className="mt-3 text-neutral-500">
          {error || "This blog could not be found."}
        </p>
        <Link
          to="/"
          className="mt-6 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  const authorName = blog.author?.name || "Anonymous";
  const authorImage = blog.author?.profileImage;

  const currentUserId = user?._id || user?.id;
  const blogAuthorId = blog.author?._id || blog.author;

  const isOwner =
    !!currentUserId &&
    !!blogAuthorId &&
    currentUserId.toString() === blogAuthorId.toString();

  return (
    <motion.main
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="min-h-screen bg-neutral-50 px-4 py-8 sm:px-6 sm:py-12"
    >
      <article className="mx-auto max-w-4xl">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 transition hover:text-violet-600"
        >
          <ArrowLeft size={18} />
          Back to stories
        </Link>

        <header className="mb-8">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl font-extrabold leading-tight tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl"
          >
            {blog.title}
          </motion.h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
            <div className="flex items-center gap-3">
              {authorImage ? (
                <img
                  src={
                    authorImage.startsWith("http")
                      ? authorImage
                      : `${BACKEND_URL}${authorImage}`
                  }
                  alt={authorName}
                  className="h-11 w-11 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                  <UserRound size={21} />
                </div>
              )}

              <div>
                <p className="font-semibold text-neutral-900">{authorName}</p>
                <p className="text-sm text-neutral-500">Author</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <CalendarDays size={17} />
              <time dateTime={blog.createdAt}>
                {new Date(blog.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
            </div>
          </div>
        </header>

        {isOwner && (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Link
              to={`/blogs/${id}/edit`}
              className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
            >
              <Pencil size={16} />
              Edit Blog
            </Link>

            <button
              type="button"
              onClick={handleDeleteBlog}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
              {isDeleting ? "Deleting..." : "Delete Blog"}
            </button>
          </div>
        )}

        {deleteError && (
          <p
            role="alert"
            className="mb-6 rounded-xl bg-red-50 p-3 text-sm text-red-600"
          >
            {deleteError}
          </p>
        )}

        <motion.button
          type="button"
          onClick={handleLike}
          disabled={isLiking}
          whileTap={{ scale: 0.9 }}
          className={`mb-6 inline-flex items-center gap-2 rounded-full border px-5 py-3 font-semibold transition ${
            isLiked
              ? "border-rose-200 bg-rose-50 text-rose-600"
              : "border-neutral-200 bg-white text-neutral-700 hover:border-rose-200 hover:text-rose-600"
          } disabled:cursor-not-allowed disabled:opacity-60`}
          aria-label={isLiked ? "Unlike this blog" : "Like this blog"}
        >
          <motion.span
            key={isLiked ? "liked" : "unliked"}
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 12 }}
          >
            <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
          </motion.span>

          <span>{likesCount}</span>
          <span>{likesCount === 1 ? "Like" : "Likes"}</span>
        </motion.button>
        {blog.coverImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-10 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 shadow-sm sm:rounded-3xl"
          >
            <img
              src={
                blog.coverImage.startsWith("http")
                  ? blog.coverImage
                  : `${BACKEND_URL}${blog.coverImage}`
              }
              alt={blog.title}
              className="max-h-[520px] w-full object-cover"
            />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10"
        >
          <div className="mb-6 text-sm font-semibold uppercase tracking-[0.18em] text-violet-600">
            The Story
          </div>

          <div className="whitespace-pre-wrap break-words text-base leading-8 text-neutral-700 sm:text-lg sm:leading-9">
            {blog.content}
          </div>
        </motion.div>

        {/* Comments Section */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-8"
        >
          <div className="mb-6 flex items-center gap-3">
            <MessageCircle className="text-violet-600" size={24} />

            <h2 className="text-2xl font-bold text-neutral-900">Comments</h2>

            <span className="rounded-full bg-violet-50 px-3 py-1 text-sm font-semibold text-violet-700">
              {comments.length}
            </span>
          </div>

          {/* Comment Form */}
          <form onSubmit={handleCommentSubmit} className="mb-8">
            <label
              htmlFor="comment"
              className="mb-2 block text-sm font-medium text-neutral-700"
            >
              Share your thoughts
            </label>

            <textarea
              id="comment"
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder={
                isAuthenticated
                  ? "What did you think of this story?"
                  : "Log in to join the conversation..."
              }
              maxLength={1000}
              rows={4}
              className="w-full resize-y rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-neutral-400">
                {commentText.length}/1000 characters
              </p>

              <motion.button
                type="submit"
                whileTap={{ scale: 0.97 }}
                disabled={!commentText.trim() || commentSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={16} />
                {commentSubmitting ? "Posting..." : "Post Comment"}
              </motion.button>
            </div>
          </form>

          {commentError && (
            <div
              role="alert"
              className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-600"
            >
              {commentError}
            </div>
          )}

          {/* Existing Comments */}
          {commentsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-xl bg-neutral-100 p-5"
                >
                  <div className="mb-3 h-4 w-32 rounded bg-neutral-200" />
                  <div className="h-3 w-full rounded bg-neutral-200" />
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="py-8 text-center">
              <MessageCircle
                size={32}
                className="mx-auto mb-3 text-neutral-300"
              />
              <p className="font-medium text-neutral-700">No comments yet</p>
              <p className="mt-1 text-sm text-neutral-500">
                Be the first to share your thoughts!
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {comments.map((comment) => (
                <motion.div
                  key={comment._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 border-b border-neutral-100 pb-5 last:border-0 last:pb-0"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-100 font-semibold text-violet-700">
                    {comment.author?.profileImage ? (
                      <img
                        src={
                          comment.author.profileImage.startsWith("http")
                            ? comment.author.profileImage
                            : `http://localhost:8000${comment.author.profileImage}`
                        }
                        alt={comment.author.name || "Author"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      comment.author?.name?.charAt(0).toUpperCase() || "U"
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className="font-semibold text-neutral-900">
                        {comment.author?.name || "Anonymous"}
                      </p>

                      <time
                        dateTime={comment.createdAt}
                        className="text-xs text-neutral-400"
                      >
                        {new Date(comment.createdAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </time>
                    </div>

                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-neutral-600">
                      {comment.content}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        <div className="py-10 text-center">
          <p className="text-neutral-500">Thanks for reading this story.</p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center gap-2 font-semibold text-violet-600 hover:text-violet-800"
          >
            <ArrowLeft size={17} />
            Explore more stories
          </Link>
        </div>
      </article>
    </motion.main>
  );
}

export default BlogDetails;
