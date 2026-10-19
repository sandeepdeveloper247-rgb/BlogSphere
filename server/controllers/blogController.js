const fs = require("fs");
const path = require("path");
const Blog = require("../models/Blog");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");

const parseTags = (rawTags) => {
  if (!rawTags) return [];
  let parsed = rawTags;

  if (typeof rawTags === "string") {
    try {
      parsed = JSON.parse(rawTags);
    } catch {
      parsed = rawTags.split(",");
    }
  }

  if (!Array.isArray(parsed)) return [];

  return [
    ...new Set(
      parsed
        .map((tag) => String(tag).trim())
        .filter((tag) => tag.length > 0 && tag.length <= 25),
    ),
  ].slice(0, 5);
};

const deleteLocalFile = (fileUrl) => {
  if (!fileUrl || !fileUrl.startsWith("/uploads/")) return;
  const filePath = path.join(__dirname, "..", fileUrl);
  fs.unlink(filePath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error("Failed to delete old cover image:", err.message);
    }
  });
};

const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate("author", "name profileImage bio")
      .sort({ createdAt: -1 });
    res.status(200).json({
      blogs,
    });
  } catch (error) {
    console.error("Get blogs error:", error);

    res.status(500).json({
      message: "Server error while fetching blogs",
    });
  }
};
const createBlog = async (req, res) => {
  try {
    const { title, content } = req.body;
    if (
      typeof title !== "string" ||
      typeof content !== "string" ||
      !title.trim() ||
      !content.trim()
    ) {
      return res.status(400).json({
        message: "Title and content are required",
      });
    }
    if (title.trim().length > 150) {
      return res.status(400).json({
        message: "Title cannot exceed 150 characters",
      });
    }
    const coverImage = req.file ? `/uploads/${req.file.filename}` : "";
    const tags = parseTags(req.body.tags);
    const blog = await Blog.create({
      title: title.trim(),
      content: content.trim(),
      coverImage,
      author: req.userId,
    });
    await blog.populate("author", "name profileImage bio");
    return res.status(201).json({
      message: "Blog published successfully",
      blog,
    });
  } catch (error) {
    console.error("Create blog error:", error);
    return res.status(500).json({
      message: "Server error while creating blog",
    });
  }
};

const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate(
      "author",
      "name profileImage bio",
    );

    if (!blog) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }

    res.status(200).json({ blog });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid blog ID",
      });
    }

    res.status(500).json({
      message: "Failed to fetch blog",
      error: error.message,
    });
  }
};

const toggleLike = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }

    const userId = req.userId.toString();

    const alreadyLiked = blog.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      blog.likes = blog.likes.filter((id) => id.toString() !== userId);
    } else {
      blog.likes.push(req.userId);
    }

    await blog.save();

    // Create a notification only when adding a new like.
    if (!alreadyLiked && blog.author.toString() !== userId) {
      try {
        const notification = await Notification.create({
          recipient: blog.author,
          sender: req.userId,
          type: "like",
          blog: blog._id,
          message: `liked your blog "${blog.title}".`,
        });

        await notification.populate("sender", "name profileImage");
        await notification.populate("blog", "title");

        const io = req.app.get("io");

        if (io) {
          io.to(`user-${blog.author.toString()}`).emit(
            "new-notification",
            notification,
          );
        }
      } catch (notificationError) {
        console.error("Like notification error:", notificationError);
      }
    }

    return res.status(200).json({
      message: alreadyLiked ? "Like removed" : "Blog liked successfully",
      likesCount: blog.likes.length,
      isLiked: !alreadyLiked,
    });
  } catch (error) {
    console.error("Toggle like error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid blog ID",
      });
    }

    return res.status(500).json({
      message: "Failed to update like",
      error: error.message,
    });
  }
};

const updateBlog = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (
      typeof title !== "string" ||
      typeof content !== "string" ||
      !title.trim() ||
      !content.trim()
    ) {
      return res.status(400).json({
        message: "Title and content are required",
      });
    }

    if (title.trim().length > 150) {
      return res.status(400).json({
        message: "Title cannot exceed 150 characters",
      });
    }

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }

    // Only the blog's author can edit it.
    if (blog.author.toString() !== req.userId.toString()) {
      return res.status(403).json({
        message: "You are not authorized to edit this blog",
      });
    }

    blog.title = title.trim();
    blog.content = content.trim();
    if (req.body.tags !== undefined) {
      blog.tags = parseTags(req.body.tags);
    }
    // Keep the existing image unless a new one is uploaded.

    if (req.file) {
      if (blog.coverImage) deleteLocalFile(blog.coverImage);
      blog.coverImage = `/uploads/${req.file.filename}`;
    } else if (req.body.removeCoverImage === "true") {
      if (blog.coverImage) deleteLocalFile(blog.coverImage);
      blog.coverImage = "";
    }

    await blog.save();
    await blog.populate("author", "name profileImage bio");

    return res.status(200).json({
      message: "Blog updated successfully",
      blog,
    });
  } catch (error) {
    console.error("Update blog error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid blog ID",
      });
    }

    return res.status(500).json({
      message: "Server error while updating blog",
    });
  }
};

const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }

    // Only the blog's author can delete it.
    if (blog.author.toString() !== req.userId.toString()) {
      return res.status(403).json({
        message: "You are not authorized to delete this blog",
      });
    }
    if (blog.coverImage) {
      deleteLocalFile(blog.coverImage);
    }
    await Comment.deleteMany({ blog: blog._id });
    await Notification.deleteMany({ blog: blog._id });
    await blog.deleteOne();

    return res.status(200).json({
      message: "Blog deleted successfully",
    });
  } catch (error) {
    console.error("Delete blog error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid blog ID",
      });
    }

    return res.status(500).json({
      message: "Server error while deleting blog",
    });
  }
};

module.exports = {
  getAllBlogs,
  createBlog,
  getBlogById,
  toggleLike,
  updateBlog,
  deleteBlog,
};
