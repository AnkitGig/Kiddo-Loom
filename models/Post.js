const mongoose = require("mongoose")

const postSchema = new mongoose.Schema(
  {
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent.children",
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    postType: {
      type: String,
      enum: ["activity", "observation", "milestone", "general"],
      default: "activity",
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    activityDetails: {
      activityName: String,
      domain: String, // "Communication and Literacies", "Fine Motor Skills", etc.
      skillArea: String, // "Communicative Practices", "Creative Expression", etc.
      ageGroup: {
        min: Number,
        max: Number,
        description: String, // "3 to 5 years"
      },
      indicators: [String], // Learning indicators/outcomes
      materials: [String], // Materials used in activity
    },
    media: [
      {
        type: {
          type: String,
          enum: ["image", "video"],
          default: "image",
        },
        url: String,
        caption: String,
        thumbnail: String, // For videos
      },
    ],
    tags: [String], // For categorization
    visibility: {
      type: String,
      enum: ["public", "parents_only", "teachers_only"],
      default: "parents_only",
    },
    likes: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        likedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    comments: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        likes: [
          {
            userId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
            likedAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for better performance
postSchema.index({ childId: 1, createdAt: -1 })
postSchema.index({ teacherId: 1, createdAt: -1 })
postSchema.index({ roomId: 1, createdAt: -1 })
postSchema.index({ postType: 1, createdAt: -1 })

module.exports = mongoose.model("Post", postSchema)
