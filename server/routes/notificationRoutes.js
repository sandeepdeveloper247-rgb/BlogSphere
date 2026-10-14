
const express = require("express");
const protect = require("../middleware/authMiddleware");

const {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require("../controllers/notificationController");

const router = express.Router();

router.use(protect);

router.get("/", getNotifications);

router.patch("/read-all", markAllNotificationsAsRead);

router.patch("/:id/read", markNotificationAsRead);

module.exports = router;
