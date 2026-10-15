
const express = require("express");
const {
  getBlogComments,
  createComment,
  updateComment,
  deleteComment,
} = require("../controllers/commentController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/:blogId", getBlogComments);
router.post("/:blogId", protect, createComment);
router.put("/comment/:commentId", protect, updateComment);
router.delete("/comment/:commentId", protect, deleteComment);

module.exports = router;