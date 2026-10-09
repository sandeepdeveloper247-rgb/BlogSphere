
const express = require("express");
const {
  getBlogComments,
  createComment,
} = require("../controllers/commentController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/:blogId", getBlogComments);
router.post("/:blogId", protect, createComment);

module.exports = router;