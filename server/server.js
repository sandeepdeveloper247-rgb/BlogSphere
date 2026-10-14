const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const connectDB = require("./config/db");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/authRoutes");
const blogRoutes = require("./routes/blogRoutes");
const commentRoutes = require("./routes/commentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const path = require("path");
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  // Allow unauthenticated connections for public real-time comments.
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error("Invalid or expired authentication token"));
  }
});

app.set("io", io);
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  if (socket.userId) {
    socket.join(`user-${socket.userId}`);
    console.log(`Authenticated user joined notification room`);
  }
  socket.on("join-blog", (blogId) => {
    if (typeof blogId !== "string" || !/^[a-fA-F0-9]{24}$/.test(blogId)) {
      return;
    }

    socket.join(`blog-${blogId}`);
    console.log(`Socket ${socket.id} joined blog-${blogId}`);
  });

  socket.on("leave-blog", (blogId) => {
    if (typeof blogId === "string" && /^[a-fA-F0-9]{24}$/.test(blogId)) {
      socket.leave(`blog-${blogId}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});
connectDB();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/auth", authRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.get("/", (req, res) => {
  res.json({
    message: "BlogSphere API is running",
  });
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
