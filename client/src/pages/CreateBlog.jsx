import { useRef, useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ImagePlus,
  X,
  Send,
  FileText,
  LoaderCircle,
  CheckCircle2,
  Tag,
  Plus,
  Eye,
  PenLine,
  Bold,
  Italic,
  Heading2,
  Code,
  FileCode,
  Quote,
  List,
  Link as LinkIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import MarkdownRenderer from "../components/MarkdownRenderer";

const MAX_TITLE_LENGTH = 150;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_TAGS = 5;
const MAX_TAG_LENGTH = 25;

const SUGGESTED_TAGS = [
  "React",
  "System Design",
  "JavaScript",
  "Career",
  "Web Dev",
  "AI",
  "DSA",
  "Backend",
];

const CreateBlog = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editorTab, setEditorTab] = useState("write");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [existingImage, setExistingImage] = useState("");

  useEffect(() => {
    if (!isEditMode) return;

    let cancelled = false;

    const fetchBlog = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/blogs/${id}`);
        const fetchedBlog = response.data.blog;

        const currentUser = JSON.parse(localStorage.getItem("user") || "null");
        const currentUserId = currentUser?._id || currentUser?.id;
        const authorId = fetchedBlog.author?._id || fetchedBlog.author;

        if (
          !currentUserId ||
          currentUserId.toString() !== authorId.toString()
        ) {
          navigate(`/blogs/${id}`, { replace: true });
          return;
        }

        if (cancelled) return;

        setTitle(fetchedBlog.title || "");
        setContent(fetchedBlog.content || "");
        setTags(Array.isArray(fetchedBlog.tags) ? fetchedBlog.tags : []);
        setExistingImage(fetchedBlog.coverImage || "");
        setImagePreview(
          fetchedBlog.coverImage
            ? fetchedBlog.coverImage.startsWith("http")
              ? fetchedBlog.coverImage
              : `http://localhost:8000${fetchedBlog.coverImage}`
            : "",
        );
      } catch (error) {
        if (!cancelled) {
          setError(
            error.response?.data?.message ||
              "Unable to load this blog for editing.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBlog();

    return () => {
      cancelled = true;
    };
  }, [id, isEditMode, navigate]);

  const insertMarkdown = (prefix, suffix = "", placeholder = "text") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = selectedText || placeholder;

    const newText =
      content.substring(0, start) +
      prefix +
      replacement +
      suffix +
      content.substring(end);

    setContent(newText);
    setEditorTab("write");

    requestAnimationFrame(() => {
      textarea.focus();
      const newCursorStart = start + prefix.length;
      const newCursorEnd = newCursorStart + replacement.length;
      textarea.setSelectionRange(newCursorStart, newCursorEnd);
    });
  };

  const addTag = (rawValue) => {
    const cleaned = rawValue.trim().replace(/^#/, "");
    if (!cleaned) return;

    if (tags.length >= MAX_TAGS) {
      setError(`You can add up to ${MAX_TAGS} tags.`);
      return;
    }

    if (cleaned.length > MAX_TAG_LENGTH) {
      setError(`Each tag must be ${MAX_TAG_LENGTH} characters or fewer.`);
      return;
    }

    const exists = tags.some(
      (existing) => existing.toLowerCase() === cleaned.toLowerCase(),
    );

    if (exists) {
      setTagInput("");
      return;
    }

    setError("");
    setTags((prev) => [...prev, cleaned]);
    setTagInput("");
  };

  const handleTagKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(tagInput);
    } else if (event.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

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
    if (imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setCoverImage(null);
    setImagePreview("");
    setExistingImage("");

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
    formData.append("tags", JSON.stringify(tags));

    if (coverImage) {
      formData.append("coverImage", coverImage);
    }

    try {
      setLoading(true);

      if (isEditMode && !existingImage && !coverImage) {
        formData.append("removeCoverImage", "true");
      }

      if (isEditMode) {
        await api.put(`/blogs/${id}`, formData);
      } else {
        await api.post("/blogs", formData);
      }

      setSuccess(true);

      setTimeout(() => {
        navigate(isEditMode ? `/blogs/${id}` : "/");
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
          to={isEditMode ? `/blogs/${id}` : "/"}
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
            {isEditMode ? "Edit your story" : "Create a story"}
            <span className="text-neutral-400">.</span>
          </h1>

          <p className="mt-4 max-w-xl leading-7 text-neutral-500">
            {isEditMode
              ? "Make changes to your story and keep it up to date."
              : "Put your thoughts into words, format with Markdown, and share your perspective with the BlogSphere community."}
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

          {/* Topic Tags */}
          <div>
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="blog-tags"
                className="flex items-center gap-1.5 text-sm font-semibold text-neutral-800"
              >
                <Tag size={15} className="text-neutral-500" />
                Topic tags{" "}
                <span className="font-normal text-neutral-400">(optional)</span>
              </label>

              <span className="text-xs text-neutral-400">
                {tags.length}/{MAX_TAGS} tags
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 focus-within:border-neutral-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-neutral-100">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    aria-label={`Remove ${tag} tag`}
                    className="rounded-full p-0.5 text-neutral-300 transition hover:bg-neutral-700 hover:text-white"
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}

              {tags.length < MAX_TAGS && (
                <div className="flex min-w-[180px] flex-1 items-center gap-2">
                  <input
                    id="blog-tags"
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    maxLength={MAX_TAG_LENGTH}
                    placeholder={
                      tags.length === 0
                        ? "Add a tag (e.g., React, System Design) and press Enter..."
                        : "Add another tag..."
                    }
                    className="w-full bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-neutral-400"
                  />

                  {tagInput.trim() && (
                    <button
                      type="button"
                      onClick={() => addTag(tagInput)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
                    >
                      <Plus size={13} />
                      Add
                    </button>
                  )}
                </div>
              )}
            </div>

            {tags.length < MAX_TAGS && (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-xs text-neutral-400">
                  Suggested:
                </span>
                {SUGGESTED_TAGS.filter(
                  (suggested) =>
                    !tags.some(
                      (t) => t.toLowerCase() === suggested.toLowerCase(),
                    ),
                ).map((suggested) => (
                  <button
                    key={suggested}
                    type="button"
                    onClick={() => addTag(suggested)}
                    className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-600 transition hover:border-neutral-400 hover:text-black"
                  >
                    + {suggested}
                  </button>
                ))}
              </div>
            )}
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

          {/* Content with Markdown Toolbar & Write / Preview Tabs */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label
                htmlFor="blog-content"
                className="text-sm font-semibold text-neutral-800"
              >
                Your story{" "}
                <span className="font-normal text-neutral-400">
                  (Markdown supported)
                </span>
              </label>

              <div className="inline-flex rounded-xl border border-neutral-200 bg-neutral-100 p-1">
                <button
                  type="button"
                  onClick={() => setEditorTab("write")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    editorTab === "write"
                      ? "bg-white text-neutral-900 shadow-sm"
                      : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  <PenLine size={14} />
                  Write
                </button>

                <button
                  type="button"
                  onClick={() => setEditorTab("preview")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    editorTab === "preview"
                      ? "bg-white text-neutral-900 shadow-sm"
                      : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  <Eye size={14} />
                  Live Preview
                </button>
              </div>
            </div>

            {editorTab === "write" && (
              <div className="mt-3 flex flex-wrap items-center gap-1 rounded-t-xl border border-b-0 border-neutral-200 bg-neutral-100/80 px-2.5 py-2">
                <button
                  type="button"
                  onClick={() => insertMarkdown("## ", "", "Heading")}
                  title="Heading"
                  className="rounded-lg p-1.5 text-neutral-600 transition hover:bg-white hover:text-black"
                >
                  <Heading2 size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => insertMarkdown("**", "**", "bold text")}
                  title="Bold"
                  className="rounded-lg p-1.5 text-neutral-600 transition hover:bg-white hover:text-black"
                >
                  <Bold size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => insertMarkdown("*", "*", "italic text")}
                  title="Italic"
                  className="rounded-lg p-1.5 text-neutral-600 transition hover:bg-white hover:text-black"
                >
                  <Italic size={16} />
                </button>

                <span className="mx-1 h-4 w-px bg-neutral-300" />

                <button
                  type="button"
                  onClick={() => insertMarkdown("`", "`", "code")}
                  title="Inline Code"
                  className="rounded-lg p-1.5 text-neutral-600 transition hover:bg-white hover:text-black"
                >
                  <Code size={16} />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    insertMarkdown(
                      "\n```javascript\n",
                      "\n```\n",
                      "// code here",
                    )
                  }
                  title="Code Block"
                  className="rounded-lg p-1.5 text-neutral-600 transition hover:bg-white hover:text-black"
                >
                  <FileCode size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => insertMarkdown("\n> ", "", "Quote")}
                  title="Quote"
                  className="rounded-lg p-1.5 text-neutral-600 transition hover:bg-white hover:text-black"
                >
                  <Quote size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => insertMarkdown("\n- ", "", "List item")}
                  title="Bullet List"
                  className="rounded-lg p-1.5 text-neutral-600 transition hover:bg-white hover:text-black"
                >
                  <List size={16} />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    insertMarkdown("[", "](https://example.com)", "link text")
                  }
                  title="Link"
                  className="rounded-lg p-1.5 text-neutral-600 transition hover:bg-white hover:text-black"
                >
                  <LinkIcon size={16} />
                </button>

                <span className="ml-auto text-xs text-neutral-400">
                  {content.trim().length} characters
                </span>
              </div>
            )}

            {editorTab === "write" ? (
              <textarea
                ref={textareaRef}
                id="blog-content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Write your story using Markdown (# Headings, **bold**, ```code blocks```, > quotes)..."
                rows={13}
                className="w-full resize-y rounded-b-xl border border-neutral-200 bg-neutral-50 px-4 py-4 font-mono text-sm leading-7 outline-none transition placeholder:font-sans placeholder:text-neutral-400 focus:border-neutral-500 focus:bg-white focus:ring-4 focus:ring-neutral-100"
                required
              />
            ) : (
              <div className="mt-3 min-h-[340px] rounded-xl border border-neutral-200 bg-white p-6">
                <MarkdownRenderer content={content} />
              </div>
            )}

            <p className="mt-2 text-xs text-neutral-400">
              Tip: Use Markdown shortcuts like{" "}
              <code className="rounded bg-neutral-100 px-1 py-0.5">##</code> for
              headings,{" "}
              <code className="rounded bg-neutral-100 px-1 py-0.5">
                **bold**
              </code>
              , or{" "}
              <code className="rounded bg-neutral-100 px-1 py-0.5">```</code>{" "}
              for code blocks. Switch to <strong>Live Preview</strong> anytime.
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
                {isEditMode
                  ? "Blog updated successfully! Returning to your story..."
                  : "Blog published successfully! Taking you home..."}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="flex flex-col-reverse gap-3 border-t border-neutral-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-xs text-neutral-400">
              <FileText size={15} />
              {isEditMode
                ? "Your changes will be saved to this story."
                : "Your story will be shared with the community."}
            </p>

            <button
              type="submit"
              disabled={loading || success}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-7 py-3.5 font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle className="animate-spin" size={18} />
                  {isEditMode ? "Saving..." : "Publishing..."}
                </>
              ) : success ? (
                <>
                  <CheckCircle2 size={18}/>
                  Published
                </>
              ) : (
                <>
                  <Send size={17}/>
                  {isEditMode ? "Save changes" : "Publish story"}
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
