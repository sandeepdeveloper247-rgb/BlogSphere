const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/authRoutes");
const blogRoutes = require("./routes/blogRoutes");
const commentRoutes = require("./routes/commentRoutes");
const path = require("path");
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.set("io", io);
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

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
app.get("/", (req, res) => {
  res.json({
    message: "BlogSphere API is running",
  });
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
