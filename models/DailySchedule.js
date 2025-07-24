const mongoose = require("mongoose")

const dailyScheduleSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    activities: [
      {
        time: String, // "08:00 AM"
        category: {
          type: String,
          enum: [
            "Creative Art",
            "Fine Motor Skills",
            "Language And Literacy",
            "Loose Part",
            "Music And Movement",
            "Science, Nature And Math",
            "Sensory Bin",
            "Physical Development",
            "Social Skills",
          ],
          required: true,
        },
        title: {
          type: String,
          required: true,
        },
        description: String,
        materials: [String],
        duration: Number, // in minutes
        learningObjectives: [String],
        ageGroup: {
          min: Number,
          max: Number,
        },
        isCompleted: {
          type: Boolean,
          default: false,
        },
        completedAt: Date,
        notes: String,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

// Ensure one schedule per room per date
dailyScheduleSchema.index({ roomId: 1, date: 1 }, { unique: true })

module.exports = mongoose.model("DailySchedule", dailyScheduleSchema)
