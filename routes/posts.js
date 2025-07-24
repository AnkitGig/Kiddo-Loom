const express = require("express")
const { auth, authorize } = require("../middleware/auth")
const { uploadGalleryImages } = require("../middleware/upload")
const { createPost, updatePost, deletePost, getMyPosts } = require("../controllers/postController")

const router = express.Router()

/**
 * ===========================================
 * 📝 POST MANAGEMENT APIS - TEACHER POST CREATION
 * ===========================================
 * These APIs handle creating and managing activity posts
 */

// 📱 SCREEN: Create Activity Post (Teacher)
// API: POST /api/posts
// Purpose: Create new activity post with photos and details
// Features: Activity documentation, photo upload, learning observations
router.post("/", auth, authorize("teacher"), uploadGalleryImages, createPost)

// 📱 SCREEN: Edit Post (Teacher)
// API: PUT /api/posts/:postId
// Purpose: Update existing post content
// Features: Edit title, description, activity details, tags
router.put("/:postId", auth, authorize("teacher"), updatePost)

// 📱 SCREEN: Delete Post (Teacher)
// API: DELETE /api/posts/:postId
// Purpose: Delete/archive post
// Features: Soft delete, content management
router.delete("/:postId", auth, authorize("teacher"), deletePost)

// 📱 SCREEN: My Posts List (Teacher)
// API: GET /api/posts/my-posts?page=1&limit=10&postType=activity
// Purpose: Get teacher's own posts
// Features: Post management, filtering, pagination
router.get("/my-posts", auth, authorize("teacher"), getMyPosts)

module.exports = router
