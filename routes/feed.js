const express = require("express")
const { auth, authorize } = require("../middleware/auth")
const {
  getFeed,
  getPostDetails,
  togglePostLike,
  addComment,
  toggleCommentLike,
} = require("../controllers/feedController")

const router = express.Router()

/**
 * ===========================================
 * 📱 FEED APIS - SOCIAL MEDIA STYLE DAYCARE FEED
 * ===========================================
 * These APIs handle the main feed screens shown in the images
 */

// 📱 SCREEN: Main Feed Screen (Today view with posts)
// API: GET /api/feed?includeSchedule=true&childId=123
// Purpose: Get main feed with posts, schedule, and notifications
// Features: Activity posts, likes, comments, today's schedule, reports notification
router.get("/", auth, getFeed)

// 📱 SCREEN: Post Details Screen (Full screen post view)
// API: GET /api/feed/posts/:postId
// Purpose: Show detailed view of a specific post
// Features: Full post content, all comments, like/comment interactions
router.get("/posts/:postId", auth, getPostDetails)

// 📱 SCREEN: Like/Unlike Post (Heart button interaction)
// API: POST /api/feed/posts/:postId/like
// Purpose: Toggle like status on a post
// Features: Like/unlike posts, like count, user feedback
router.post("/posts/:postId/like", auth, togglePostLike)

// 📱 SCREEN: Comments Screen (Comments view)
// API: POST /api/feed/posts/:postId/comments
// Purpose: Add new comment to a post
// Features: Add comments, real-time updates, user interactions
router.post("/posts/:postId/comments", auth, addComment)

// 📱 SCREEN: Comment Like (Heart button on comments)
// API: POST /api/feed/posts/:postId/comments/:commentId/like
// Purpose: Like/unlike individual comments
// Features: Comment likes, interaction tracking
router.post("/posts/:postId/comments/:commentId/like", auth, toggleCommentLike)

module.exports = router
