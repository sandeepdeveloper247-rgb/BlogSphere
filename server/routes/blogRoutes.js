const express=require("express");
const {getAllBlogs,createBlog,getBlogById,toggleLike,updateBlog,deleteBlog,toggleBookmark}=require("../controllers/blogController");

const protect=require("../middleware/authMiddleware");
const upload=require("../middleware/uploadMiddleware");

const router=express.Router();
router.get("/",getAllBlogs);
router.get("/:id", getBlogById);

router.post("/",protect,upload.single("coverImage"),createBlog);
router.put("/:id", protect, upload.single("coverImage"), updateBlog);
router.delete("/:id", protect, deleteBlog);
router.post("/:id/like", protect, toggleLike);
router.post("/:id/bookmark", protect, toggleBookmark);
module.exports=router;