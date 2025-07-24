const Post = require("../models/Post")
const Parent = require("../models/Parent")
const { uploadGalleryImages } = require("../middleware/upload")

/**
 * ===========================================
 * 📝 POST CREATION APIS - TEACHER POST MANAGEMENT
 * ===========================================
 * These APIs handle creating and managing activity posts
 */

// @desc    Create new activity post
// @route   POST /api/posts
// @access  Private (Teacher only)
const createPost = async (req, res) => {
  try {
    const {
      childId,
      postType = "activity",
      title,
      description,
      activityDetails,
      tags,
      visibility = "parents_only",
    } = req.body

    // Validation
    if (!childId || !title || !description) {
      return res.status(400).json({
        success: false,
        message: "Child ID, title, and description are required",
      })
    }

    // Get teacher profile to get room info
    const TeacherProfile = require("../models/TeacherProfile")
    const teacherProfile = await TeacherProfile.findOne({ userId: req.user._id })
    if (!teacherProfile) {
      return res.status(404).json({
        success: false,
        message: "Teacher profile not found",
      })
    }

    // Handle uploaded media files
    let media = []
    if (req.files && req.files.length > 0) {
      const { getFileUrl } = require("../middleware/upload")
      media = req.files.map((file) => ({
        type: file.mimetype.startsWith("video/") ? "video" : "image",
        url: getFileUrl(req, file.filename, "gallery"),
        caption: "",
      }))
    }

    // Create post
    const post = new Post({
      childId,
      teacherId: req.user._id,
      roomId: teacherProfile.schoolId, // This should be roomId
      postType,
      title: title.trim(),
      description: description.trim(),
      activityDetails: activityDetails || {},
      media,
      tags: tags || [],
      visibility,
    })

    await post.save()

    // Populate for response
    await post.populate("teacherId", "firstName lastName profileImage")
    await post.populate("roomId", "roomName roomNumber")

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: {
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
        tags: post.tags,
        visibility: post.visibility,
        createdAt: post.createdAt,
      },
    })
  } catch (error) {
    console.error("Create post error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create post",
      error: error.message,
    })
  }
}

// @desc    Update post
// @route   PUT /api/posts/:postId
// @access  Private (Teacher only - own posts)
const updatePost = async (req, res) => {
  try {
    const { postId } = req.params
    const { title, description, activityDetails, tags, visibility } = req.body

    const post = await Post.findById(postId)
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      })
    }

    // Check if user owns this post
    if (post.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied - you can only edit your own posts",
      })
    }

    // Update fields
    if (title) post.title = title.trim()
    if (description) post.description = description.trim()
    if (activityDetails) post.activityDetails = { ...post.activityDetails, ...activityDetails }
    if (tags) post.tags = tags
    if (visibility) post.visibility = visibility

    await post.save()

    res.json({
      success: true,
      message: "Post updated successfully",
      data: {
        id: post._id,
        title: post.title,
        description: post.description,
        activityDetails: post.activityDetails,
        tags: post.tags,
        visibility: post.visibility,
        updatedAt: post.updatedAt,
      },
    })
  } catch (error) {
    console.error("Update post error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update post",
      error: error.message,
    })
  }
}

// @desc    Delete post
// @route   DELETE /api/posts/:postId
// @access  Private (Teacher only - own posts)
const deletePost = async (req, res) => {
  try {
    const { postId } = req.params

    const post = await Post.findById(postId)
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      })
    }

    // Check if user owns this post
    if (post.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied - you can only delete your own posts",
      })
    }

    // Soft delete - mark as archived
    post.isArchived = true
    await post.save()

    res.json({
      success: true,
      message: "Post deleted successfully",
    })
  } catch (error) {
    console.error("Delete post error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete post",
      error: error.message,
    })
  }
}

// @desc    Get posts by teacher
// @route   GET /api/posts/my-posts
// @access  Private (Teacher only)
const getMyPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, postType } = req.query

    const query = {
      teacherId: req.user._id,
      isArchived: false,
    }

    if (postType) {
      query.postType = postType
    }

    const posts = await Post.find(query)
      .populate("childId")
      .populate("roomId", "roomName roomNumber")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number.parseInt(limit))

    const total = await Post.countDocuments(query)

    const formattedPosts = posts.map((post) => ({
      id: post._id,
      type: post.postType,
      title: post.title,
      description: post.description,
      activityDetails: post.activityDetails,
      media: post.media,
      likes: post.likes.length,
      comments: post.comments.length,
      tags: post.tags,
      visibility: post.visibility,
      createdAt: post.createdAt,
    }))

    res.json({
      success: true,
      data: {
        posts: formattedPosts,
        pagination: {
          current: Number.parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    })
  } catch (error) {
    console.error("Get my posts error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch posts",
      error: error.message,
    })
  }
}

module.exports = {
  createPost,
  updatePost,
  deletePost,
  getMyPosts,
}
