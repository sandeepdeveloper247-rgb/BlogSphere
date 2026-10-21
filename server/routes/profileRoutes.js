const express = require("express");
const {
  getMyProfile,
  updateMyProfile,
  getPublicProfile,
} = require("../controllers/profileController");

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/me", protect, getMyProfile);
router.put("/me", protect, upload.single("profileImage"), updateMyProfile);

router.get("/:userId", getPublicProfile);

module.exports = router;
