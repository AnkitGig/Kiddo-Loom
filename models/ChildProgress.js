const mongoose = require("mongoose")

const childProgressSchema = new mongoose.Schema(
  {
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent.children",
      required: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent",
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
    reportDate: {
      type: Date,
      required: true,
    },
    reportType: {
      type: String,
      enum: ["daily", "weekly", "monthly", "quarterly"],
      default: "daily",
    },

    // Daily Activities Summary
    meals: [
      {
        type: {
          type: String,
          enum: ["breakfast", "lunch", "afternoon_snack", "dinner"],
        },
        items: String, // "Oatmeal with milk and oranges"
        time: String,
        amountEaten: {
          type: String,
          enum: ["all", "most", "some", "little", "none"],
        },
      },
    ],

    mood: {
      overall: {
        type: String,
        enum: ["playful", "energetic", "calm", "fussy", "sleepy", "excited", "happy"],
      },
      notes: String,
    },

    activities: [
      {
        name: String,
        category: String,
        description: String,
        participation: {
          type: String,
          enum: ["active", "moderate", "passive", "reluctant"],
        },
        skills_demonstrated: [String],
        time: String,
      },
    ],

    // Learning Observations
    observations: [
      {
        domain: String, // "Communication and Literacies"
        skill: String, // "Children learn conventions of their languages"
        indicator: String, // "Growing in their understanding of vocabulary"
        observation: String,
        photos: [String],
        developmentLevel: {
          type: String,
          enum: ["emerging", "developing", "secure", "advanced"],
        },
      },
    ],

    // Physical Care
    sleepSessions: [
      {
        startTime: String,
        endTime: String,
        duration: Number, // in minutes
        quality: {
          type: String,
          enum: ["good", "restless", "poor"],
        },
      },
    ],

    diaperChanges: [
      {
        time: String,
        type: {
          type: String,
          enum: ["wet", "soiled", "dry"],
        },
        notes: String,
      },
    ],

    attendance: {
      status: {
        type: String,
        enum: ["present", "absent", "late", "early_pickup"],
        default: "present",
      },
      checkInTime: String,
      checkOutTime: String,
    },

    // Teacher Notes
    teacherNotes: String,
    parentNotes: String,

    // Media
    photos: [
      {
        url: String,
        caption: String,
        timestamp: Date,
        activity: String,
      },
    ],

    // Status
    isCompleted: {
      type: Boolean,
      default: false,
    },
    parentViewed: {
      type: Boolean,
      default: false,
    },
    parentViewedAt: Date,
  },
  {
    timestamps: true,
  },
)

// Indexes
childProgressSchema.index({ childId: 1, reportDate: -1 })
childProgressSchema.index({ parentId: 1, reportDate: -1 })
childProgressSchema.index({ teacherId: 1, reportDate: -1 })

module.exports = mongoose.model("ChildProgress", childProgressSchema)
