import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  PenLine,
  Mail,
  LoaderCircle,
  Settings,
  X,
  Check,
  CalendarDays,
  FileText,
  Camera,
  Trash2,
  Bookmark,
  Clock,
  Compass,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const BACKEND_URL = "http://localhost:8000";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

const getImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("blob:")) return path;
  return `${BACKEND_URL}${path}`;
};

const getReadTime = (content = "") => {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
};
const stripMarkdown = (text = "") =>
  text
    .replace(/```[\s\S]*?```/g, "[Code] ") // Replaces big code blocks with "[Code]"
    .replace(/!\[.*?\]\(.*?\)/g, "") // Removes markdown image links
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Turns [link text](url) into "link text"
    .replace(/[#>*_`~-]/g, "") // Removes #, >, *, _, `, ~, - symbols
    .replace(/\s+/g, " ") // Collapses extra spaces/newlines
    .trim();
const Profile = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profileData, setProfileData] = useState(null);
  const [userBlogs, setUserBlogs] = useState([]);
  const [savedBlogs, setSavedBlogs] = useState([]);
  const [activeTab, setActiveTab] = useState("published"); // "published" | "saved"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", bio: "" });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const response = await api.get("/profile/me");

        const fetchedUser = response.data.user;
        setProfileData(fetchedUser);
        setUserBlogs(response.data.blogs || []);
        setSavedBlogs(response.data.savedBlogs || []);
        setEditForm({
          name: fetchedUser.name || "",
          bio: fetchedUser.bio || "",
        });
        setImagePreview(getImageUrl(fetchedUser.profileImage));
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleEditToggle = () => {
    if (isEditing && profileData) {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      setEditForm({
        name: profileData.name || "",
        bio: profileData.bio || "",
      });
      setSelectedImage(null);
      setRemoveCurrentImage(false);
      setImagePreview(getImageUrl(profileData.profileImage));
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    setSaveError("");
    setIsEditing(!isEditing);
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setSaveError("Please choose a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setSaveError("Profile picture must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setSaveError("");
    setSelectedImage(file);
    setRemoveCurrentImage(false);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedImage(null);
    setImagePreview("");
    setRemoveCurrentImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveError("");

    if (!editForm.name.trim()) {
      setSaveError("Name cannot be empty.");
      return;
    }

    try {
      setSaveLoading(true);

      const formData = new FormData();
      formData.append("name", editForm.name.trim());
      formData.append("bio", editForm.bio.trim());

      if (selectedImage) {
        formData.append("profileImage", selectedImage);
      } else if (removeCurrentImage) {
        formData.append("removeProfileImage", "true");
      }

      const response = await api.put("/profile/me", formData);
      const updatedUser = response.data.user;

      setProfileData(updatedUser);
      setSelectedImage(null);
      setRemoveCurrentImage(false);
      setImagePreview(getImageUrl(updatedUser.profileImage));

      const currentToken = localStorage.getItem("token");
      if (currentToken) {
        login(updatedUser, currentToken);
      }

      setIsEditing(false);
    } catch (err) {
      setSaveError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <LoaderCircle className="animate-spin text-violet-600" size={36} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
        <h2 className="text-2xl font-bold text-neutral-900">Oops!</h2>
        <p className="mt-3 text-neutral-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 rounded-xl bg-black px-5 py-3 font-medium text-white transition hover:bg-neutral-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  const displayedBlogs = activeTab === "published" ? userBlogs : savedBlogs;

  return (
    <motion.main
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="min-h-screen bg-neutral-50 px-4 py-10 sm:px-6 lg:py-14"
    >
      <div className="mx-auto max-w-5xl">
        {/* Profile Header Card */}
        <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <div className="h-32 bg-neutral-900 sm:h-40" />

          <div className="px-6 pb-8 sm:px-10">
            <div className="relative -mt-12 mb-4 flex flex-wrap items-end justify-between gap-4 sm:-mt-16">
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-neutral-100 text-neutral-400 shadow-sm sm:h-32 sm:w-32">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt={profileData?.name || "Profile"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User size={48} />
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />

                {isEditing && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload new photo"
                    className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-black text-white shadow-md transition hover:bg-neutral-800"
                  >
                    <Camera size={16} />
                  </button>
                )}
              </div>

              {!isEditing && (
                <button
                  onClick={handleEditToggle}
                  className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50"
                >
                  <Settings size={16} />
                  Edit Profile
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.form
                  key="edit-form"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleSaveProfile}
                  className="mt-6 max-w-xl space-y-5 overflow-hidden"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100"
                    >
                      <Camera size={14} />
                      Change Photo
                    </button>

                    {imagePreview && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-medium text-red-600 transition hover:bg-red-100"
                      >
                        <Trash2 size={14} />
                        Remove Photo
                      </button>
                    )}

                    <span className="text-xs text-neutral-400">
                      JPG, PNG or WebP · Max 5 MB
                    </span>
                  </div>

                  {saveError && (
                    <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
                      {saveError}
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-700">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      maxLength={80}
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 outline-none focus:border-neutral-400 focus:bg-white focus:ring-4 focus:ring-neutral-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-700">
                      Bio
                    </label>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) =>
                        setEditForm({ ...editForm, bio: e.target.value })
                      }
                      maxLength={200}
                      rows={3}
                      placeholder="Tell us a little about yourself..."
                      className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 outline-none focus:border-neutral-400 focus:bg-white focus:ring-4 focus:ring-neutral-100"
                    />
                    <p className="mt-1 text-xs text-neutral-400">
                      {editForm.bio.length}/200
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleEditToggle}
                      disabled={saveLoading}
                      className="flex items-center gap-2 rounded-xl border border-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saveLoading}
                      className="flex items-center gap-2 rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
                    >
                      {saveLoading ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <Check size={16} />
                      )}
                      {saveLoading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.div
                  key="profile-info"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <h1 className="text-3xl font-bold text-neutral-900">
                    {profileData?.name}
                  </h1>
                  <div className="mt-2 flex items-center gap-2 text-neutral-500">
                    <Mail size={16} />
                    <span className="text-sm">{profileData?.email}</span>
                  </div>
                  <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-700">
                    {profileData?.bio || "This user hasn't added a bio yet."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Tabs for Published & Saved Stories */}
        <div className="mt-10 flex flex-wrap items-center gap-3 border-b border-neutral-200 pb-4">
          <button
            type="button"
            onClick={() => setActiveTab("published")}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
              activeTab === "published"
                ? "bg-black text-white shadow-sm"
                : "bg-white text-neutral-600 hover:bg-neutral-100 hover:text-black"
            }`}
          >
            <FileText size={16} />
            Published Stories
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                activeTab === "published"
                  ? "bg-white/20 text-white"
                  : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {userBlogs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("saved")}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
              activeTab === "saved"
                ? "bg-black text-white shadow-sm"
                : "bg-white text-neutral-600 hover:bg-neutral-100 hover:text-black"
            }`}
          >
            <Bookmark size={16} />
            Saved Stories
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                activeTab === "saved"
                  ? "bg-white/20 text-white"
                  : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {savedBlogs.length}
            </span>
          </button>
        </div>

        {/* Stories Grid */}
        <div className="mt-8">
          {displayedBlogs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
                {activeTab === "published" ? (
                  <PenLine size={24} className="text-neutral-500" />
                ) : (
                  <Bookmark size={24} className="text-neutral-500" />
                )}
              </div>
              <h3 className="mt-5 text-xl font-semibold text-neutral-900">
                {activeTab === "published"
                  ? "You haven't published anything yet"
                  : "No saved stories yet"}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
                {activeTab === "published"
                  ? "Ready to share your ideas with the world? Start writing your first blog post today."
                  : "Bookmark interesting stories while reading to build your personal reading list."}
              </p>
              <Link
                to={activeTab === "published" ? "/create" : "/explore"}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                {activeTab === "published" ? (
                  <>
                    <PenLine size={16} />
                    Write a Story
                  </>
                ) : (
                  <>
                    <Compass size={16} />
                    Explore Stories
                  </>
                )}
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {displayedBlogs.map((blog, index) => (
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
                          <Clock size={13} />
                          <span>{getReadTime(blog.content)}</span>
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

export default Profile;
