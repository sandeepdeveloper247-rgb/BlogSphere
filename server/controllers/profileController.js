const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const Blog = require("../models/Blog");

const deleteLocalFile = (fileUrl) => {
  if (!fileUrl || !fileUrl.startsWith("/uploads/")) return;
  const filePath = path.join(__dirname, "..", fileUrl);
  fs.unlink(filePath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error("Failed to delete old file:", err.message);
    }
  });
};

// Get the logged-in user's profile and published blogs
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const blogs = await Blog.find({
      author: user._id,
    })
      .populate("author", "name profileImage")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      user,
      blogs,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      message: "Failed to fetch profile",
    });
  }
};

// Update the logged-in user's name and bio
const updateMyProfile = async (req, res) => {
  try {
    const { name, bio, removeProfileImage } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "Name cannot be empty",
      });
    }

    if (name.trim().length > 80) {
      return res.status(400).json({
        message: "Name cannot exceed 80 characters",
      });
    }

    if (bio !== undefined && typeof bio !== "string") {
      return res.status(400).json({
        message: "Bio must be text",
      });
    }

    if (typeof bio === "string" && bio.length > 200) {
      return res.status(400).json({
        message: "Bio cannot exceed 200 characters",
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.name = name.trim();

    if (bio !== undefined) {
      user.bio = bio.trim();
    }

    if (req.file) {
      if (user.profileImage) {
        deleteLocalFile(user.profileImage);
      }
      user.profileImage = `/uploads/${req.file.filename}`;
    } else if (removeProfileImage === "true") {
      if (user.profileImage) {
        deleteLocalFile(user.profileImage);
      }
      user.profileImage = "";
    }

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      message: "Failed to update profile",
    });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
};
