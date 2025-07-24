const Post = require("../models/Post")
const ChildProgress = require("../models/ChildProgress")
const DailySchedule = require("../models/DailySchedule")
const Parent = require("../models/Parent")
const User = require("../models/User")

/**
 * ===========================================
 * 📱 FEED APIS - SOCIAL MEDIA STYLE DAYCARE FEED
 * ===========================================
 * These APIs handle the main feed screens shown in the images
 */

// @desc    Get main feed for parent/teacher
// @route   GET /api/feed
// @access  Private
const getFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10, childId, postType } = req.query

    const query = { isArchived: false }

    // Filter by child if parent is requesting
    if (req.user.role === "parent") {
      const parent = await Parent.findOne({ userId: req.user._id })
      if (!parent) {
        return res.status(404).json({
          success: false,
          message: "Parent profile not found",
        })
      }

      const childIds = parent.children.map((child) => child._id)
      query.childId = { $in: childIds }
    }

    // Filter by specific child
    if (childId) {
      query.childId = childId
    }

    // Filter by post type
    if (postType) {
      query.postType = postType
    }

    const posts = await Post.find(query)
      .populate("childId")
      .populate("teacherId", "firstName lastName profileImage")
      .populate("roomId", "roomNumber roomName")
      .populate("likes.userId", "firstName lastName profileImage")
      .populate("comments.userId", "firstName lastName profileImage")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number.parseInt(limit))

    // Format posts for feed
    const formattedPosts = posts.map((post) => ({
      id: post._id,
      type: post.postType,
      title: post.title,
      description: post.description,
      activityDetails: post.activityDetails,
      media: post.media,
      teacher: {
        id: post.teacherId._id,
        name: `${post.teacherId.firstName} ${post.teacherId.lastName}`,
        profileImage: post.teacherId.profileImage,
      },
      room: post.roomId
        ? {
            id: post.roomId._id,
            name: post.roomId.roomName,
            number: post.roomId.roomNumber,
          }
        : null,
      likes: {
        count: post.likes.length,
        users: post.likes.map((like) => ({
          id: like.userId._id,
          name: `${like.userId.firstName} ${like.userId.lastName}`,
          profileImage: like.userId.profileImage,
          likedAt: like.likedAt,
        })),
        hasLiked: post.likes.some((like) => like.userId._id.toString() === req.user._id.toString()),
      },
      comments: {
        count: post.comments.length,
        recent: post.comments.slice(-3).map((comment) => ({
          id: comment._id,
          content: comment.content,
          user: {
            id: comment.userId._id,
            name: `${comment.userId.firstName} ${comment.userId.lastName}`,
            profileImage: comment.userId.profileImage,
          },
          likes: comment.likes.length,
          hasLiked: comment.likes.some((like) => like.userId._id.toString() === req.user._id.toString()),
          createdAt: comment.createdAt,
        })),
      },
      tags: post.tags,
      createdAt: post.createdAt,
      timeAgo: getTimeAgo(post.createdAt),
    }))

    // Get today's schedule if requested
    let todaysSchedule = null
    if (req.query.includeSchedule === "true") {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      todaysSchedule = await DailySchedule.findOne({
        date: today,
        isActive: true,
      }).populate("roomId", "roomName roomNumber")
    }

    // Get reports notification
    const reportsReady = await checkReportsReady(req.user)

    const total = await Post.countDocuments(query)

    res.json({
      success: true,
      data: {
        posts: formattedPosts,
        todaysSchedule: todaysSchedule
          ? {
              id: todaysSchedule._id,
              room: todaysSchedule.roomId,
              activities: todaysSchedule.activities,
              date: todaysSchedule.date,
            }
          : null,
        notifications: {
          reportsReady: reportsReady.ready,
          reportsCount: reportsReady.count,
        },
        pagination: {
          current: Number.parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      },
    })
  } catch (error) {
    console.error("Get feed error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch feed",
      error: error.message,
    })
  }
}

// @desc    Get post details
// @route   GET /api/feed/posts/:postId
// @access  Private
const getPostDetails = async (req, res) => {
  try {
    const { postId } = req.params

    const post = await Post.findById(postId)
      .populate("childId")
      .populate("teacherId", "firstName lastName profileImage")
      .populate("roomId", "roomNumber roomName")
      .populate("likes.userId", "firstName lastName profileImage")
      .populate("comments.userId", "firstName lastName profileImage")

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      })
    }

    // Check if user has access to this post
    if (req.user.role === "parent") {
      const parent = await Parent.findOne({ userId: req.user._id })
      const hasAccess = parent.children.some((child) => child._id.toString() === post.childId.toString())

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this post",
        })
      }
    }

    const formattedPost = {
      id: post._id,
      type: post.postType,
      title: post.title,
      description: post.description,
      activityDetails: post.activityDetails,
      media: post.media,
      teacher: {
        id: post.teacherId._id,
        name: `${post.teacherId.firstName} ${post.teacherId.lastName}`,
        profileImage: post.teacherId.profileImage,
      },
      room: post.roomId
        ? {
            id: post.roomId._id,
            name: post.roomId.roomName,
            number: post.roomId.roomNumber,
          }
        : null,
      likes: {
        count: post.likes.length,
        users: post.likes.map((like) => ({
          id: like.userId._id,
          name: `${like.userId.firstName} ${like.userId.lastName}`,
          profileImage: like.userId.profileImage,
          likedAt: like.likedAt,
        })),
        hasLiked: post.likes.some((like) => like.userId._id.toString() === req.user._id.toString()),
      },
      comments: {
        count: post.comments.length,
        all: post.comments.map((comment) => ({
          id: comment._id,
          content: comment.content,
          user: {
            id: comment.userId._id,
            name: `${comment.userId.firstName} ${comment.userId.lastName}`,
            profileImage: comment.userId.profileImage,
          },
          likes: comment.likes.length,
          hasLiked: comment.likes.some((like) => like.userId._id.toString() === req.user._id.toString()),
          createdAt: comment.createdAt,
          timeAgo: getTimeAgo(comment.createdAt),
        })),
      },
      tags: post.tags,
      createdAt: post.createdAt,
      timeAgo: getTimeAgo(post.createdAt),
    }

    res.json({
      success: true,
      data: formattedPost,
    })
  } catch (error) {
    console.error("Get post details error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch post details",
      error: error.message,
    })
  }
}

// @desc    Like/Unlike a post
// @route   POST /api/feed/posts/:postId/like
// @access  Private
const togglePostLike = async (req, res) => {
  try {
    const { postId } = req.params

    const post = await Post.findById(postId)
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      })
    }

    const existingLike = post.likes.find((like) => like.userId.toString() === req.user._id.toString())

    if (existingLike) {
      // Unlike
      post.likes = post.likes.filter((like) => like.userId.toString() !== req.user._id.toString())
    } else {
      // Like
      post.likes.push({
        userId: req.user._id,
        likedAt: new Date(),
      })
    }

    await post.save()

    res.json({
      success: true,
      message: existingLike ? "Post unliked" : "Post liked",
      data: {
        liked: !existingLike,
        likesCount: post.likes.length,
      },
    })
  } catch (error) {
    console.error("Toggle post like error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to toggle like",
      error: error.message,
    })
  }
}

// @desc    Add comment to post
// @route   POST /api/feed/posts/:postId/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { postId } = req.params
    const { content } = req.body

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required",
      })
    }

    const post = await Post.findById(postId)
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      })
    }

    const newComment = {
      userId: req.user._id,
      content: content.trim(),
      likes: [],
      createdAt: new Date(),
    }

    post.comments.push(newComment)
    await post.save()

    // Populate the new comment
    await post.populate("comments.userId", "firstName lastName profileImage")

    const addedComment = post.comments[post.comments.length - 1]

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: {
        id: addedComment._id,
        content: addedComment.content,
        user: {
          id: addedComment.userId._id,
          name: `${addedComment.userId.firstName} ${addedComment.userId.lastName}`,
          profileImage: addedComment.userId.profileImage,
        },
        likes: 0,
        hasLiked: false,
        createdAt: addedComment.createdAt,
        timeAgo: getTimeAgo(addedComment.createdAt),
      },
    })
  } catch (error) {
    console.error("Add comment error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to add comment",
      error: error.message,
    })
  }
}

// @desc    Like/Unlike a comment
// @route   POST /api/feed/posts/:postId/comments/:commentId/like
// @access  Private
const toggleCommentLike = async (req, res) => {
  try {
    const { postId, commentId } = req.params

    const post = await Post.findById(postId)
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      })
    }

    const comment = post.comments.id(commentId)
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      })
    }

    const existingLike = comment.likes.find((like) => like.userId.toString() === req.user._id.toString())

    if (existingLike) {
      // Unlike
      comment.likes = comment.likes.filter((like) => like.userId.toString() !== req.user._id.toString())
    } else {
      // Like
      comment.likes.push({
        userId: req.user._id,
        likedAt: new Date(),
      })
    }

    await post.save()

    res.json({
      success: true,
      message: existingLike ? "Comment unliked" : "Comment liked",
      data: {
        liked: !existingLike,
        likesCount: comment.likes.length,
      },
    })
  } catch (error) {
    console.error("Toggle comment like error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to toggle comment like",
      error: error.message,
    })
  }
}

// Helper function to calculate time ago
const getTimeAgo = (date) => {
  const now = new Date()
  const diffInMs = now - date
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`
  } else {
    return `${diffInDays}d ago`
  }
}

// Helper function to check if reports are ready
const checkReportsReady = async (user) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (user.role === "parent") {
      const parent = await Parent.findOne({ userId: user._id })
      if (!parent) return { ready: false, count: 0 }

      const childIds = parent.children.map((child) => child._id)
      const reportsCount = await ChildProgress.countDocuments({
        childId: { $in: childIds },
        reportDate: today,
        isCompleted: true,
        parentViewed: false,
      })

      return { ready: reportsCount > 0, count: reportsCount }
    }

    return { ready: false, count: 0 }
  } catch (error) {
    console.error("Check reports ready error:", error)
    return { ready: false, count: 0 }
  }
}

module.exports = {
  getFeed,
  getPostDetails,
  togglePostLike,
  addComment,
  toggleCommentLike,
}
