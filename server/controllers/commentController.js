const Comment = require("../models/Comment");
const Blog = require("../models/Blog");
const Notification = require("../models/Notification");
// Get all comments for a particular blog
const getBlogComments = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId);

    if (!blog) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }

    const comments = await Comment.find({
      blog: req.params.blogId,
    })
      .populate("author", "name profileImage")
      .sort({ createdAt: 1 });

    res.status(200).json({ comments });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid blog ID",
      });
    }

    res.status(500).json({
      message: "Failed to fetch comments",
      error: error.message,
    });
  }
};

const createComment = async (req, res) => {
  try {
    const { content } = req.body;
    const { blogId } = req.params;

    if (!content || !content.trim()) {
      return res.status(400).json({
        message: "Comment cannot be empty",
      });
    }

    if (content.trim().length > 1000) {
      return res.status(400).json({
        message: "Comment cannot exceed 1000 characters",
      });
    }

    const blog = await Blog.findById(blogId);

    if (!blog) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }

    const comment = await Comment.create({
      content: content.trim(),
      blog: blogId,
      author: req.userId,
    });

    await comment.populate("author", "name profileImage");

    const blogAuthorId = blog.author.toString();
    const commenterId = req.userId.toString();

    if (blogAuthorId !== commenterId) {
      const notification = await Notification.create({
        recipient: blog.author,
        sender: req.userId,
        type: "comment",
        blog: blogId,
        message: `${comment.author.name} commented on your blog "${blog.title}".`,
      });

      await notification.populate("sender", "name profileImage");
      await notification.populate("blog", "title");

      const io = req.app.get("io");

      if (io) {
        io.to(`user-${blogAuthorId}`).emit("new-notification", notification);
      }
    }

    const io = req.app.get("io");

    if (io) {
      io.to(`blog-${blogId}`).emit("new-comment", comment);
    }
    res.status(201).json({
      message: "Comment added successfully",
      comment,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid blog ID",
      });
    }

    res.status(500).json({
      message: "Failed to add comment",
      error: error.message,
    });
  }
};

module.exports = {
  getBlogComments,
  createComment,
};
