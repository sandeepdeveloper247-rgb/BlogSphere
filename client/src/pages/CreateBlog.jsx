import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ImagePlus,
  X,
  Send,
  FileText,
  LoaderCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const MAX_TITLE_LENGTH = 150;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const CreateBlog = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Please choose a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("The cover image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setError("");
    setCoverImage(file);

    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setCoverImage(null);
    setImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!title.trim() || !content.trim()) {
      setError("Please enter both a title and the blog content.");
      return;
    }

    if (title.trim().length > MAX_TITLE_LENGTH) {
      setError("Your title cannot exceed 150 characters.");
      return;
    }

    const formData = new FormData();

    formData.append("title", title.trim());
    formData.append("content", content.trim());

    if (coverImage) {
      formData.append("coverImage", coverImage);
    }

    try {
      setLoading(true);

      await api.post("/blogs", formData);

      setSuccess(true);

      // Navigate after briefly displaying the success state.
      setTimeout(() => {
        navigate("/");
      }, 900);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to publish your blog. Please try again.",
      );

      if (error.response?.status === 401) {
        setError("Your session may have expired. Please log in again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-5">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold">Login required</h1>

          <p className="mt-3 text-neutral-500">
            Please log in before publishing a story.
          </p>

          <Link
            to="/login"
            className="mt-6 inline-flex rounded-full bg-black px-6 py-3 font-medium text-white"
          >
            Go to Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10 sm:px-6 lg:py-14">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 transition hover:text-black"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mt-7"
        >
          <p className="text-sm font-medium uppercase tracking-widest text-neutral-400">
            Your writing space
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight text-neutral-950 sm:text-5xl">
            Create a story<span className="text-neutral-400">.</span>
          </h1>

          <p className="mt-4 max-w-xl leading-7 text-neutral-500">
            Put your thoughts into words, add a cover image, and share your
            perspective with the BlogSphere community.
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-9 space-y-7 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-9"
        >
          {/* Title */}
          <div>
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="blog-title"
                className="text-sm font-semibold text-neutral-800"
              >
                Blog title
              </label>

              <span
                className={`text-xs ${
                  title.length > MAX_TITLE_LENGTH
                    ? "text-red-500"
                    : "text-neutral-400"
                }`}
              >
                {title.length}/{MAX_TITLE_LENGTH}
              </span>
            </div>

            <input
              id="blog-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={MAX_TITLE_LENGTH}
              placeholder="Give your story a meaningful title..."
              className="mt-3 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-lg font-medium outline-none transition placeholder:text-neutral-400 focus:border-neutral-500 focus:bg-white focus:ring-4 focus:ring-neutral-100"
              required
            />
          </div>

          {/* Cover Image */}
          <div>
            <label className="text-sm font-semibold text-neutral-800">
              Cover image{" "}
              <span className="font-normal text-neutral-400">(optional)</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />

            {imagePreview ? (
              <div className="relative mt-3 overflow-hidden rounded-2xl border border-neutral-200">
                <img
                  src={imagePreview}
                  alt="Selected cover preview"
                  className="max-h-96 w-full object-cover"
                />

                <button
                  type="button"
                  onClick={removeImage}
                  aria-label="Remove cover image"
                  className="absolute right-3 top-3 rounded-full bg-black/75 p-2 text-white transition hover:bg-black"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 flex min-h-44 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 px-5 py-8 transition hover:border-neutral-400 hover:bg-neutral-100"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                  <ImagePlus size={22} className="text-neutral-600" />
                </div>

                <span className="mt-4 text-sm font-semibold text-neutral-800">
                  Click to upload a cover image
                </span>

                <span className="mt-2 text-xs text-neutral-400">
                  JPG, PNG or WebP · Maximum 5 MB
                </span>
              </button>
            )}

            {imagePreview && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 text-sm font-medium text-neutral-600 underline underline-offset-4 hover:text-black"
              >
                Change image
              </button>
            )}
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="blog-content"
                className="text-sm font-semibold text-neutral-800"
              >
                Your story
              </label>

              <span className="text-xs text-neutral-400">
                {content.trim().length} characters
              </span>
            </div>

            <textarea
              id="blog-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Start writing your story here..."
              rows={12}
              className="mt-3 w-full resize-y rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-4 leading-7 outline-none transition placeholder:text-neutral-400 focus:border-neutral-500 focus:bg-white focus:ring-4 focus:ring-neutral-100"
              required
            />

            <p className="mt-2 text-xs text-neutral-400">
              Write clearly and share something worth reading.
            </p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                >
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
              >
                <CheckCircle2 size={18} />
                Blog published successfully! Taking you home...
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="flex flex-col-reverse gap-3 border-t border-neutral-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-xs text-neutral-400">
              <FileText size={15} />
              Your story will be shared with the community.
            </p>

            <button
              type="submit"
              disabled={loading || success}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-7 py-3.5 font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Publishing...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 size={18} />
                  Published
                </>
              ) : (
                <>
                  <Send size={17} />
                  Publish story
                </>
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </main>
  );
};

export default CreateBlog;
