const express=require("express");
const {getAllBlogs,createBlog,getBlogById,toggleLike,}=require("../controllers/blogController");

const protect=require("../middleware/authMiddleware");
const upload=require("../middleware/uploadMiddleware");

const router=express.Router();
router.get("/",getAllBlogs);
router.get("/:id", getBlogById);
router.post("/",protect,upload.single("coverImage"),createBlog);
router.post("/:id/like", protect, toggleLike);
module.exports=router;